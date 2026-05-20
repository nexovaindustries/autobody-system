import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { publicRateLimiter } from '../middleware/rateLimiter';
import { ORDER_STATUS_TO_STAGE, ORDER_STATUS_LABELS, TrackingStage, OrderStatus } from '@autobody/shared';

const router = Router();
const prisma = new PrismaClient();

router.get('/:codigo', publicRateLimiter, async (req: Request, res: Response) => {
  const normalized = req.params.codigo.toUpperCase().trim();

  const order = await prisma.order.findUnique({
    where: { codigoSeguimiento: normalized },
    include: {
      cliente: { select: { nombre: true, telefono: true } },
      vehiculo: { select: { placa: true, marca: true, modelo: true, color: true } },
      statusLogs: {
        orderBy: { createdAt: 'asc' },
        select: { status: true, mensaje: true, createdAt: true },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ success: false, error: 'Código de seguimiento no encontrado' });
  }

  const stage: TrackingStage = ORDER_STATUS_TO_STAGE[order.status as OrderStatus];

  const stages = [
    {
      id: 'RECEPCION',
      label: 'Recepción',
      emoji: '🔴',
      description: 'Vehículo recibido en el taller',
      active: stage === 'RECEPCION',
      completed: ['EN_REPARACION', 'LISTO_ENTREGA', 'COMPLETADO'].includes(stage),
    },
    {
      id: 'EN_REPARACION',
      label: 'En Reparación',
      emoji: '🟡',
      description: 'Trabajos de reparación en proceso',
      active: stage === 'EN_REPARACION',
      completed: ['LISTO_ENTREGA', 'COMPLETADO'].includes(stage),
    },
    {
      id: 'LISTO_ENTREGA',
      label: 'Listo para Entrega',
      emoji: '🟢',
      description: 'Reparación completada, listo para recoger',
      active: stage === 'LISTO_ENTREGA',
      completed: stage === 'COMPLETADO',
    },
  ];

  return res.json({
    success: true,
    data: {
      codigo: order.codigoSeguimiento,
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status as OrderStatus],
      stage,
      stages,
      isWaitingParts: order.status === 'ESPERANDO_REPUESTOS',
      mensajeCliente: order.mensajeCliente,
      fechaIngreso: order.createdAt,
      fechaEstimadaEntrega: order.fechaEstimadaEntrega,
      ultimaActualizacion: order.updatedAt,
      vehiculo: {
        placa: order.vehiculo.placa,
        descripcion: `${order.vehiculo.marca} ${order.vehiculo.modelo}`,
        color: order.vehiculo.color,
      },
      cliente: { nombre: order.cliente.nombre },
      historial: order.statusLogs.map(log => ({
        status: log.status,
        statusLabel: ORDER_STATUS_LABELS[log.status as OrderStatus],
        mensaje: log.mensaje,
        fecha: log.createdAt,
      })),
    },
  });
});

export default router;
