import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateQuotationNumber } from '../utils/tokens';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { InterventionType } from '@autobody/shared';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

const VALID_INTERVENTIONS: InterventionType[] = [
  'REEMPLAZO', 'PLANCHADO', 'MASILLA_Y_PINTURA', 'PINTURA_SOLAMENTE',
  'REPARACION', 'REVISION_DIAGNOSTICO', 'LIMPIEZA_DETAILING',
];

const itemSchema = z.object({
  zonaId: z.string(),
  zonaLabel: z.string(),
  subcomponenteId: z.string(),
  subcomponenteLabel: z.string(),
  tipoIntervencion: z.enum(['REEMPLAZO', 'PLANCHADO', 'MASILLA_Y_PINTURA', 'PINTURA_SOLAMENTE', 'REPARACION', 'REVISION_DIAGNOSTICO', 'LIMPIEZA_DETAILING']),
  descripcion: z.string().optional(),
  costoManoObra: z.number().min(0),
  costoMateriales: z.number().min(0),
});

const quotationSchema = z.object({
  clienteId: z.string().uuid().optional(),
  cliente: z.object({
    nombre: z.string().min(2),
    dni_ruc: z.string().optional(),
    telefono: z.string().min(7),
    email: z.string().email().optional().or(z.literal('')),
  }).optional(),
  vehiculoId: z.string().uuid().optional(),
  vehiculo: z.object({
    placa: z.string().min(6).max(8),
    marca: z.string().min(1),
    modelo: z.string().min(1),
    anio: z.number().int().min(1950).max(2030).optional(),
    color: z.string().optional(),
    kilometraje: z.number().int().min(0).optional(),
  }).optional(),
  aseguradora: z.string().min(1),
  numeroSiniestro: z.string().optional(),
  items: z.array(itemSchema).min(1),
  tiempoEstimadoDias: z.number().int().min(1),
  notas: z.string().optional(),
  validezDias: z.number().int().min(1).default(15),
});

router.use(authenticate);

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = quotationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.errors });
  }

  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let clienteId = data.clienteId;
      if (!clienteId && data.cliente) {
        const existing = data.cliente.dni_ruc
          ? await tx.customer.findFirst({ where: { dni_ruc: data.cliente.dni_ruc } })
          : null;
        const cliente = existing ?? await tx.customer.create({
          data: {
            nombre: data.cliente.nombre,
            dni_ruc: data.cliente.dni_ruc,
            telefono: data.cliente.telefono,
            email: data.cliente.email || null,
          },
        });
        clienteId = cliente.id;
      }

      let vehiculoId = data.vehiculoId;
      if (!vehiculoId && data.vehiculo) {
        const existing = await tx.vehicle.findUnique({
          where: { placa: data.vehiculo.placa.toUpperCase() },
        });
        const vehiculo = existing ?? await tx.vehicle.create({
          data: {
            placa: data.vehiculo.placa.toUpperCase(),
            marca: data.vehiculo.marca,
            modelo: data.vehiculo.modelo,
            anio: data.vehiculo.anio,
            color: data.vehiculo.color,
            kilometraje: data.vehiculo.kilometraje,
            customerId: clienteId,
          },
        });
        vehiculoId = vehiculo.id;
      }

      const subtotal = data.items.reduce((acc, item) => acc + item.costoManoObra + item.costoMateriales, 0);
      const igv = Math.round(subtotal * 0.18 * 100) / 100;
      const total = Math.round((subtotal + igv) * 100) / 100;
      const numero = generateQuotationNumber(new Date().getFullYear());

      const quotation = await tx.quotation.create({
        data: {
          numero,
          clienteId: clienteId!,
          vehiculoId: vehiculoId!,
          aseguradora: data.aseguradora,
          numeroSiniestro: data.numeroSiniestro,
          tiempoEstimadoDias: data.tiempoEstimadoDias,
          notas: data.notas,
          validezDias: data.validezDias,
          subtotal,
          igv,
          total,
          createdById: req.user!.id,
          items: {
            create: data.items.map(item => ({
              zonaId: item.zonaId,
              zonaLabel: item.zonaLabel,
              subcomponenteId: item.subcomponenteId,
              subcomponenteLabel: item.subcomponenteLabel,
              tipoIntervencion: item.tipoIntervencion,
              descripcion: item.descripcion,
              costoManoObra: item.costoManoObra,
              costoMateriales: item.costoMateriales,
              subtotal: item.costoManoObra + item.costoMateriales,
            })),
          },
        },
        include: {
          cliente: true,
          vehiculo: true,
          items: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      return quotation;
    });

    // Generate PDF async
    const pdfDir = path.join(process.cwd(), 'pdfs');
    generateQuotationPDF({
      numero: result.numero,
      fecha: result.createdAt.toLocaleDateString('es-PE'),
      validezDias: result.validezDias,
      cliente: {
        nombre: result.cliente.nombre,
        dni_ruc: result.cliente.dni_ruc ?? undefined,
        telefono: result.cliente.telefono,
        email: result.cliente.email ?? undefined,
      },
      vehiculo: {
        placa: result.vehiculo.placa,
        marca: result.vehiculo.marca,
        modelo: result.vehiculo.modelo,
        anio: result.vehiculo.anio ?? undefined,
        color: result.vehiculo.color ?? undefined,
      },
      aseguradora: result.aseguradora,
      numeroSiniestro: result.numeroSiniestro ?? undefined,
      items: result.items.map(i => ({
        zonaLabel: i.zonaLabel,
        subcomponenteLabel: i.subcomponenteLabel,
        tipoIntervencion: i.tipoIntervencion,
        descripcion: i.descripcion ?? undefined,
        costoManoObra: i.costoManoObra,
        costoMateriales: i.costoMateriales,
        subtotal: i.subtotal,
      })),
      subtotal: result.subtotal,
      igv: result.igv,
      total: result.total,
      tiempoEstimadoDias: result.tiempoEstimadoDias,
      notas: result.notas ?? undefined,
    }, pdfDir).then(filename => {
      prisma.quotation.update({ where: { id: result.id }, data: { pdfPath: filename } }).catch(console.error);
    }).catch(console.error);

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return res.status(500).json({ success: false, error: 'Error al crear la proforma' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', aseguradora, aprobada, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, any> = {};
  if (aseguradora) where.aseguradora = aseguradora;
  if (aprobada !== undefined) where.aprobada = aprobada === 'true';
  if (search) {
    where.OR = [
      { numero: { contains: String(search), mode: 'insensitive' } },
      { cliente: { nombre: { contains: String(search), mode: 'insensitive' } } },
      { vehiculo: { placa: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: true,
        vehiculo: true,
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.quotation.count({ where }),
  ]);

  return res.json({
    success: true,
    data: { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: req.params.id },
    include: { cliente: true, vehiculo: true, items: true, createdBy: { select: { id: true, name: true } }, order: true },
  });

  if (!quotation) return res.status(404).json({ success: false, error: 'Proforma no encontrada' });
  return res.json({ success: true, data: quotation });
});

router.patch('/:id/approve', async (req: AuthRequest, res: Response) => {
  const quotation = await prisma.quotation.update({
    where: { id: req.params.id },
    data: { aprobada: true },
    include: { cliente: true, vehiculo: true },
  });
  return res.json({ success: true, data: quotation });
});

export default router;
