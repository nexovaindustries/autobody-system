import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Search, ChevronRight, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TO_STAGE, OrderStatus } from '@autobody/shared';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

const STATUS_ORDER: OrderStatus[] = [
  'RECIBIDO', 'EN_EVALUACION', 'ESPERANDO_REPUESTOS',
  'EN_PLANCHADO', 'EN_PINTURA', 'EN_CONTROL_CALIDAD', 'LISTO', 'ENTREGADO',
];

const STAGE_COLORS: Record<string, string> = {
  RECEPCION: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  EN_REPARACION: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  LISTO_ENTREGA: 'text-green-400 bg-green-500/10 border-green-500/30',
  COMPLETADO: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

interface Order {
  id: string;
  codigoSeguimiento: string;
  status: OrderStatus;
  mensajeCliente?: string;
  createdAt: string;
  updatedAt: string;
  cliente: { nombre: string; telefono: string };
  vehiculo: { placa: string; marca: string; modelo: string };
  tecnico?: { id: string; name: string };
}

interface StatusModalProps {
  order: Order;
  onClose: () => void;
}

function StatusModal({ order, onClose }: StatusModalProps) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
  const [mensaje, setMensaje] = useState(order.mensajeCliente ?? '');

  const mutation = useMutation({
    mutationFn: () => api.patch(`/orders/${order.id}/status`, { status: newStatus, mensaje }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6">
        <h3 className="font-bold text-white mb-1">Cambiar Estado</h3>
        <p className="text-gray-400 text-sm mb-4">
          {order.vehiculo.placa} · {order.cliente.nombre}
        </p>

        <div className="mb-4">
          <label className="label">Nuevo Estado</label>
          <div className="flex flex-col gap-1.5">
            {STATUS_ORDER.map(s => (
              <button
                key={s}
                onClick={() => setNewStatus(s)}
                className={clsx(
                  'text-left px-4 py-3 rounded-lg text-sm border transition-all min-h-[44px]',
                  newStatus === s
                    ? 'bg-brand-500/20 border-brand-500 text-white'
                    : 'bg-surface-800 border-surface-700 text-gray-300 hover:border-surface-600'
                )}
              >
                {ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="label">Mensaje para el cliente (opcional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            placeholder="Mensaje visible en el portal de seguimiento..."
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Guardando...' : 'Confirmar Cambio'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderList() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, filterStatus],
    queryFn: () => api.get('/orders', {
      params: { page, limit: 20, search: search || undefined, status: filterStatus || undefined },
    }).then(r => r.data),
  });

  const orders: Order[] = data?.data?.items ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages: number = data?.data?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Buscar por código, cliente o placa..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="select w-auto min-w-[180px]"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">Todos los estados</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500">{total} orden{total !== 1 ? 'es' : ''} encontrada{total !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Código</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Cliente</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Vehículo</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Estado</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Técnico</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Ingreso</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-surface-800">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-surface-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No se encontraron órdenes
                  </td>
                </tr>
              )}
              {orders.map(order => {
                const stage = ORDER_STATUS_TO_STAGE[order.status];
                return (
                  <tr key={order.id} className="table-row">
                    <td className="px-4 py-3">
                      <span className="font-mono text-brand-400 font-semibold">{order.codigoSeguimiento}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{order.cliente.nombre}</p>
                      <p className="text-gray-500 text-xs">{order.cliente.telefono}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-white">{order.vehiculo.placa}</p>
                      <p className="text-gray-500 text-xs">{order.vehiculo.marca} {order.vehiculo.modelo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge border', STAGE_COLORS[stage])}>
                        {order.status === 'ESPERANDO_REPUESTOS' && <AlertCircle size={11} />}
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {order.tecnico?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(order.createdAt), 'dd/MM/yy', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn-ghost p-2 rounded-lg text-gray-400 hover:text-white"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-surface-700">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-2 text-sm disabled:opacity-40">
              ← Anterior
            </button>
            <span className="flex items-center px-4 text-sm text-gray-400">
              {page} / {totalPages}
            </span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-2 text-sm disabled:opacity-40">
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {selectedOrder && (
        <StatusModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
