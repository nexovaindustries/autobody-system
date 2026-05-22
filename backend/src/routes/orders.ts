import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateTrackingCode } from '../utils/tokens';
import { ORDER_STATUS_LABELS, OrderStatus } from '@autobody/shared';

const router = Router();
const prisma = new PrismaClient();

const VALID_STATUSES: OrderStatus[] = [
  'RECIBIDO', 'EN_EVALUACION', 'ESPERANDO_REPUESTOS',
  'EN_PLANCHADO', 'EN_PINTURA', 'EN_CONTROL_CALIDAD', 'LISTO', 'ENTREGADO',
];

const createOrderSchema = z.object({
  cotizacionId: z.string().uuid(),
  tecnicoId: z.string().uuid().optional(),
  notas: z.string().optional(),
  fechaEstimadaEntrega: z.string().datetime().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['RECIBIDO', 'EN_EVALUACION', 'ESPERANDO_REPUESTOS', 'EN_PLANCHADO', 'EN_PINTURA', 'EN_CONTROL_CALIDAD', 'LISTO', 'ENTREGADO']),
  mensaje: z.string().optional(),
  tecnicoId: z.string().uuid().optional().nullable(),
});

router.use(authenticate);

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.errors });
  }

  const { cotizacionId, tecnicoId, notas, fechaEstimadaEntrega } = parsed.data;

  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: cotizacionId },
      include: { order: true },
    });

    if (!quotation) return res.status(404).json({ success: false, error: 'Proforma no encontrada' });
    if (quotation.order) return res.status(409).json({ success: false, error: 'Ya existe una orden para esta proforma' });

    let trackingCode: string = '';
    for (let i = 0; i < 10; i++) {
      const candidate = generateTrackingCode();
      const exists = await prisma.order.findUnique({ where: { codigoSeguimiento: candidate } });
      if (!exists) { trackingCode = candidate; break; }
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          codigoSeguimiento: trackingCode,
          cotizacionId,
          clienteId: quotation.clienteId,
          vehiculoId: quotation.vehiculoId,
          tecnicoId,
          notas,
          fechaEstimadaEntrega: fechaEstimadaEntrega ? new Date(fechaEstimadaEntrega) : undefined,
          status: 'RECIBIDO',
        },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: newOrder.id,
          status: 'RECIBIDO',
          mensaje: 'Vehículo recibido en taller',
          userId: req.user!.id,
        },
      });

      await tx.quotation.update({ where: { id: cotizacionId }, data: { aprobada: true } });

      return newOrder;
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        cliente: true,
        vehiculo: true,
        tecnico: { select: { id: true, name: true } },
        cotizacion: { include: { items: true } },
        statusLogs: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    return res.status(201).json({ success: true, data: fullOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, error: 'Error al crear la orden' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', status, tecnicoId, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (tecnicoId) where.tecnicoId = tecnicoId;
  if (search) {
    where.OR = [
      { codigoSeguimiento: { contains: String(search), mode: 'insensitive' } },
      { cliente: { nombre: { contains: String(search), mode: 'insensitive' } } },
      { vehiculo: { placa: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: true,
        vehiculo: true,
        tecnico: { select: { id: true, name: true } },
        _count: { select: { statusLogs: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return res.json({
    success: true,
    data: { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

router.get('/stats/dashboard', async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const [allOrders, monthlyQuotations] = await Promise.all([
    prisma.order.findMany({ select: { status: true, createdAt: true } }),
    prisma.quotation.findMany({
      where: { aprobada: true, createdAt: { gte: startOfMonth } },
      select: { total: true, aseguradora: true },
    }),
  ]);

  const activeToday = allOrders.filter(o => o.status !== 'ENTREGADO' && new Date(o.createdAt) >= startOfDay).length;
  const activeWeek = allOrders.filter(o => o.status !== 'ENTREGADO' && new Date(o.createdAt) >= startOfWeek).length;

  const byStatusMap = new Map<string, number>();
  for (const o of allOrders) {
    byStatusMap.set(o.status, (byStatusMap.get(o.status) ?? 0) + 1);
  }
  const byStatus = [...byStatusMap.entries()].map(([status, count]) => ({ status, count }));

  const monthlyRevenue = monthlyQuotations.reduce((acc, q) => acc + q.total, 0);

  const aseguradoraMap = new Map<string, number>();
  for (const q of monthlyQuotations) {
    aseguradoraMap.set(q.aseguradora, (aseguradoraMap.get(q.aseguradora) ?? 0) + 1);
  }
  const byAseguradora = [...aseguradoraMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([aseguradora, count]) => ({ aseguradora, count }));

  return res.json({ success: true, data: { activeToday, activeWeek, byStatus, monthlyRevenue, byAseguradora } });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      cliente: true,
      vehiculo: true,
      tecnico: { select: { id: true, name: true } },
      cotizacion: { include: { items: true } },
      statusLogs: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!order) return res.status(404).json({ success: false, error: 'Orden no encontrada' });
  return res.json({ success: true, data: order });
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Datos inválidos', details: parsed.error.errors });
  }

  const { status, mensaje, tecnicoId } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const updateData: any = { status, mensajeCliente: mensaje };
      if (tecnicoId !== undefined) {
        updateData.tecnicoId = tecnicoId;
      }

      await tx.order.update({
        where: { id: req.params.id },
        data: updateData,
      });

      await tx.orderStatusLog.create({
        data: { orderId: req.params.id, status, mensaje, userId: req.user!.id },
      });
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: true,
        vehiculo: true,
        statusLogs: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    return res.json({ success: true, data: fullOrder });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar el estado' });
  }
});

export default router;
