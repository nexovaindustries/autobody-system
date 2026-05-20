import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Clock, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import { api } from '@/lib/api';
import clsx from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TrackingStage {
  id: string;
  label: string;
  emoji: string;
  description: string;
  active: boolean;
  completed: boolean;
}

interface TrackingData {
  codigo: string;
  status: string;
  statusLabel: string;
  stage: string;
  stages: TrackingStage[];
  isWaitingParts: boolean;
  mensajeCliente?: string;
  fechaIngreso: string;
  fechaEstimadaEntrega?: string;
  ultimaActualizacion: string;
  vehiculo: { placa: string; descripcion: string; color?: string };
  cliente: { nombre: string };
  historial: Array<{ status: string; statusLabel: string; mensaje?: string; fecha: string }>;
}

function formatDate(date: string | undefined) {
  if (!date) return '—';
  return format(new Date(date), "d 'de' MMMM yyyy, HH:mm", { locale: es });
}

export default function TrackingPortal() {
  const [codigo, setCodigo] = useState('');
  const [searchCode, setSearchCode] = useState('');

  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: TrackingData }>({
    queryKey: ['tracking', searchCode],
    queryFn: () => api.get(`/api/tracking/${searchCode}`).then(r => r.data),
    enabled: !!searchCode,
    retry: false,
  });

  const tracking = data?.data;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = codigo.trim().toUpperCase();
    if (cleaned) setSearchCode(cleaned);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Header */}
      <header className="bg-surface-900 border-b border-surface-800 px-4 py-5">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-white">AUTO</span>
            <span className="text-brand-500">BODY</span>
            <span className="text-white"> SAC</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Portal de Seguimiento de Vehículo</p>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <label className="block text-sm text-gray-400 mb-2">
            Ingresa tu código de seguimiento (ej: ABO-7842-XK)
          </label>
          <div className="flex gap-2">
            <input
              className="input flex-1 text-center font-mono text-lg uppercase tracking-widest"
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              placeholder="ABO-XXXX-XX"
              maxLength={12}
              required
            />
            <button type="submit" className="btn-primary px-6 min-w-[52px]" disabled={isLoading}>
              {isLoading ? <span className="animate-spin">⏳</span> : <Search size={18} />}
            </button>
          </div>
        </form>

        {isError && (
          <div className="card p-6 text-center border-red-500/30">
            <p className="text-red-400 font-semibold">Código no encontrado</p>
            <p className="text-gray-500 text-sm mt-1">Verifica el código e intenta nuevamente</p>
          </div>
        )}

        {tracking && (
          <div className="flex flex-col gap-6">
            {/* Vehicle Info */}
            <div className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Vehículo</p>
                  <p className="text-xl font-bold text-white font-mono mt-0.5">{tracking.vehiculo.placa}</p>
                  <p className="text-gray-400 text-sm">{tracking.vehiculo.descripcion} {tracking.vehiculo.color ? `· ${tracking.vehiculo.color}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Código</p>
                  <p className="font-mono font-bold text-brand-400">{tracking.codigo}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-surface-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Ingreso</p>
                  <p className="text-white text-xs">{formatDate(tracking.fechaIngreso)}</p>
                </div>
                <div className="bg-surface-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Entrega estimada</p>
                  <p className={clsx('text-xs', tracking.fechaEstimadaEntrega ? 'text-white' : 'text-gray-500')}>
                    {tracking.fechaEstimadaEntrega ? formatDate(tracking.fechaEstimadaEntrega) : 'Por confirmar'}
                  </p>
                </div>
              </div>
            </div>

            {/* Waiting parts alert */}
            {tracking.isWaitingParts && (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <Package className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-amber-300 font-semibold text-sm">Esperando repuestos</p>
                  <p className="text-amber-400/70 text-xs mt-0.5">Se está gestionando la adquisición de piezas para tu vehículo</p>
                </div>
              </div>
            )}

            {/* Progress Stages */}
            <div className="card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Estado de la Reparación</p>
              <div className="flex flex-col gap-0">
                {tracking.stages.map((stage, idx) => (
                  <div key={stage.id} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 flex-shrink-0 transition-all',
                        stage.active ? 'bg-brand-500 border-brand-300 animate-pulse' :
                          stage.completed ? 'bg-green-600 border-green-400' :
                            'bg-surface-800 border-surface-600'
                      )}>
                        {stage.completed ? <CheckCircle size={18} className="text-white" /> : stage.emoji}
                      </div>
                      {idx < tracking.stages.length - 1 && (
                        <div className={clsx(
                          'w-0.5 flex-1 min-h-[32px] mt-1 mb-1',
                          stage.completed ? 'bg-green-600' : 'bg-surface-700'
                        )} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <p className={clsx(
                        'font-semibold text-sm',
                        stage.active ? 'text-brand-400' : stage.completed ? 'text-green-400' : 'text-gray-500'
                      )}>{stage.label}</p>
                      <p className="text-xs text-gray-500">{stage.description}</p>
                      {stage.active && tracking.mensajeCliente && (
                        <div className="mt-2 bg-brand-500/10 border border-brand-500/20 rounded-lg p-3">
                          <p className="text-brand-300 text-xs">{tracking.mensajeCliente}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} />
                Última actualización: {formatDate(tracking.ultimaActualizacion)}
              </div>
            </div>

            {/* History */}
            {tracking.historial.length > 1 && (
              <div className="card p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Historial de Estados</p>
                <div className="flex flex-col gap-2">
                  {[...tracking.historial].reverse().map((log, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-white font-medium">{log.statusLabel}</span>
                        {log.mensaje && <span className="text-gray-400 ml-2">— {log.mensaje}</span>}
                        <p className="text-xs text-gray-600">{formatDate(log.fecha)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!searchCode && !isError && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500">Ingresa tu código de seguimiento para ver el estado de tu vehículo</p>
            <p className="text-gray-600 text-sm mt-2">El código fue entregado al momento de ingresar tu auto al taller</p>
          </div>
        )}
      </main>

      <footer className="border-t border-surface-800 px-4 py-4 text-center text-xs text-gray-600">
        Autobody SAC · Av. Aviación Km. 6 Interior, Cerro Colorado, Arequipa · Pintura Sikkens
      </footer>
    </div>
  );
}
