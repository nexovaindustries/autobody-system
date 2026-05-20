import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { ASEGURADORAS, InterventionType, INTERVENTION_LABELS } from '@autobody/shared';
import { api } from '@/lib/api';
import VehicleDiagram from '../vehicle/VehicleDiagram';
import ZonePanel from '../vehicle/ZonePanel';
import { ZONE_BY_ID } from '../vehicle/vehicleZonesConfig';
import clsx from 'clsx';

interface QuotationItem {
  zonaId: string;
  zonaLabel: string;
  subcomponenteId: string;
  subcomponenteLabel: string;
  tipoIntervencion: InterventionType;
  descripcion: string;
  costoManoObra: number;
  costoMateriales: number;
}

interface SelectedSubcomponent {
  zonaId: string;
  subcomponenteId: string;
  tipoIntervencion: InterventionType;
}

const IGV = 0.18;

export default function QuotationForm({ onSuccess }: { onSuccess?: (data: unknown) => void }) {
  const queryClient = useQueryClient();
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [selectedSubcomponents, setSelectedSubcomponents] = useState<SelectedSubcomponent[]>([]);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [showItemTable, setShowItemTable] = useState(true);

  const [cliente, setCliente] = useState({ nombre: '', dni_ruc: '', telefono: '', email: '' });
  const [vehiculo, setVehiculo] = useState({ placa: '', marca: '', modelo: '', anio: '', color: '', kilometraje: '' });
  const [meta, setMeta] = useState({
    aseguradora: 'Particular',
    numeroSiniestro: '',
    tiempoEstimadoDias: 5,
    notas: '',
    validezDias: 15,
  });

  const subtotal = items.reduce((acc, i) => acc + i.costoManoObra + i.costoMateriales, 0);
  const igv = subtotal * IGV;
  const total = subtotal + igv;

  const mutation = useMutation({
    mutationFn: (data: unknown) => api.post('/quotations', data).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`Proforma ${data.data.numero} creada exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      onSuccess?.(data.data);
    },
    onError: () => toast.error('Error al crear la proforma'),
  });

  const handleZoneClick = (zoneId: string) => {
    setActiveZone(prev => prev === zoneId ? null : zoneId);
  };

  const handleToggleSubcomponent = (zonaId: string, subcomponenteId: string, tipo: InterventionType) => {
    const existing = selectedSubcomponents.find(
      s => s.zonaId === zonaId && s.subcomponenteId === subcomponenteId
    );

    if (existing) {
      if (existing.tipoIntervencion !== tipo) {
        // Si el tipo es diferente, actualizamos el tipo de intervención directamente en lugar de deseleccionar
        setSelectedSubcomponents(prev => prev.map(
          s => s.zonaId === zonaId && s.subcomponenteId === subcomponenteId
            ? { ...s, tipoIntervencion: tipo }
            : s
        ));
        setItems(prev => prev.map(
          i => i.zonaId === zonaId && i.subcomponenteId === subcomponenteId
            ? { ...i, tipoIntervencion: tipo }
            : i
        ));
      } else {
        // Si es el mismo tipo, deseleccionamos el subcomponente
        setSelectedSubcomponents(prev => prev.filter(
          s => !(s.zonaId === zonaId && s.subcomponenteId === subcomponenteId)
        ));
        setItems(prev => prev.filter(
          i => !(i.zonaId === zonaId && i.subcomponenteId === subcomponenteId)
        ));
      }
    } else {
      const zone = ZONE_BY_ID[zonaId];
      const sub = zone.subcomponents.find(s => s.id === subcomponenteId)!;
      setSelectedSubcomponents(prev => [...prev, { zonaId, subcomponenteId, tipoIntervencion: tipo }]);
      setItems(prev => [...prev, {
        zonaId,
        zonaLabel: zone.label,
        subcomponenteId,
        subcomponenteLabel: sub.label,
        tipoIntervencion: tipo,
        descripcion: '',
        costoManoObra: 0,
        costoMateriales: 0,
      }]);
    }
  };

  const updateItem = (idx: number, field: keyof QuotationItem, value: string | number | InterventionType) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    
    if (field === 'tipoIntervencion') {
      const item = items[idx];
      setSelectedSubcomponents(prev => prev.map(s =>
        s.zonaId === item.zonaId && s.subcomponenteId === item.subcomponenteId
          ? { ...s, tipoIntervencion: value as InterventionType }
          : s
      ));
    }
  };

  const removeItem = (idx: number) => {
    const item = items[idx];
    setItems(prev => prev.filter((_, i) => i !== idx));
    setSelectedSubcomponents(prev => prev.filter(
      s => !(s.zonaId === item.zonaId && s.subcomponenteId === item.subcomponenteId)
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Agrega al menos un ítem a la proforma'); return; }
    if (!cliente.nombre || !cliente.telefono) { toast.error('Nombre y teléfono del cliente son obligatorios'); return; }
    if (!vehiculo.placa || !vehiculo.marca || !vehiculo.modelo) { toast.error('Placa, marca y modelo son obligatorios'); return; }

    mutation.mutate({
      cliente: {
        nombre: cliente.nombre,
        dni_ruc: cliente.dni_ruc || undefined,
        telefono: cliente.telefono,
        email: cliente.email || undefined,
      },
      vehiculo: {
        placa: vehiculo.placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio ? Number(vehiculo.anio) : undefined,
        color: vehiculo.color || undefined,
        kilometraje: vehiculo.kilometraje ? Number(vehiculo.kilometraje) : undefined,
      },
      aseguradora: meta.aseguradora,
      numeroSiniestro: meta.numeroSiniestro || undefined,
      items: items.map(i => ({
        zonaId: i.zonaId,
        zonaLabel: i.zonaLabel,
        subcomponenteId: i.subcomponenteId,
        subcomponenteLabel: i.subcomponenteLabel,
        tipoIntervencion: i.tipoIntervencion,
        descripcion: i.descripcion || undefined,
        costoManoObra: i.costoManoObra,
        costoMateriales: i.costoMateriales,
      })),
      tiempoEstimadoDias: meta.tiempoEstimadoDias,
      notas: meta.notas || undefined,
      validezDias: meta.validezDias,
    });
  };

  const selectedZoneIds = [...new Set(selectedSubcomponents.map(s => s.zonaId))];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Client + Vehicle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-xs">1</span>
            Datos del Cliente
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nombre completo / Razón social *</label>
              <input className="input" value={cliente.nombre} onChange={e => setCliente(p => ({ ...p, nombre: e.target.value }))} placeholder="Juan García López" required />
            </div>
            <div>
              <label className="label">DNI / RUC</label>
              <input className="input" value={cliente.dni_ruc} onChange={e => setCliente(p => ({ ...p, dni_ruc: e.target.value }))} placeholder="12345678" />
            </div>
            <div>
              <label className="label">Teléfono *</label>
              <input className="input" value={cliente.telefono} onChange={e => setCliente(p => ({ ...p, telefono: e.target.value }))} placeholder="987 654 321" required />
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input className="input" type="email" value={cliente.email} onChange={e => setCliente(p => ({ ...p, email: e.target.value }))} placeholder="correo@ejemplo.com" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-xs">2</span>
            Datos del Vehículo
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Placa *</label>
              <input className="input font-mono uppercase" value={vehiculo.placa} onChange={e => setVehiculo(p => ({ ...p, placa: e.target.value.toUpperCase() }))} placeholder="ABC-123" required />
            </div>
            <div>
              <label className="label">Color</label>
              <input className="input" value={vehiculo.color} onChange={e => setVehiculo(p => ({ ...p, color: e.target.value }))} placeholder="Blanco Perla" />
            </div>
            <div>
              <label className="label">Marca *</label>
              <input className="input" value={vehiculo.marca} onChange={e => setVehiculo(p => ({ ...p, marca: e.target.value }))} placeholder="Toyota" required />
            </div>
            <div>
              <label className="label">Modelo *</label>
              <input className="input" value={vehiculo.modelo} onChange={e => setVehiculo(p => ({ ...p, modelo: e.target.value }))} placeholder="Corolla" required />
            </div>
            <div>
              <label className="label">Año</label>
              <input className="input" type="number" value={vehiculo.anio} onChange={e => setVehiculo(p => ({ ...p, anio: e.target.value }))} placeholder="2020" min="1950" max="2030" />
            </div>
            <div>
              <label className="label">Kilometraje</label>
              <input className="input" type="number" value={vehiculo.kilometraje} onChange={e => setVehiculo(p => ({ ...p, kilometraje: e.target.value }))} placeholder="45000" />
            </div>
            <div>
              <label className="label">Aseguradora *</label>
              <select className="select" value={meta.aseguradora} onChange={e => setMeta(p => ({ ...p, aseguradora: e.target.value }))}>
                {ASEGURADORAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label">N° Siniestro / Expediente</label>
              <input className="input" value={meta.numeroSiniestro} onChange={e => setMeta(p => ({ ...p, numeroSiniestro: e.target.value }))} placeholder="SIN-2025-XXXX" />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Selector */}
      <div className="card p-4">
        <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
          <span className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-xs">3</span>
          Selector de Zonas y Daños
          {selectedSubcomponents.length > 0 && (
            <span className="ml-auto badge bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {selectedSubcomponents.length} subcomponente{selectedSubcomponents.length !== 1 ? 's' : ''} seleccionado{selectedSubcomponents.length !== 1 ? 's' : ''}
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <VehicleDiagram
            selectedZones={selectedZoneIds}
            onZoneClick={handleZoneClick}
            activeZone={activeZone ?? undefined}
            selectedSubcomponents={selectedSubcomponents}
          />
          <ZonePanel
            zoneId={activeZone}
            selectedSubcomponents={selectedSubcomponents}
            onToggleSubcomponent={handleToggleSubcomponent}
            onClose={() => setActiveZone(null)}
          />
        </div>
      </div>

      {/* Items Table */}
      {items.length > 0 && (
        <div className="card">
          <button
            type="button"
            onClick={() => setShowItemTable(p => !p)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-800 rounded-xl transition-colors"
          >
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-xs">4</span>
              Tabla de Ítems y Precios
              <span className="badge bg-surface-700 text-gray-300">{items.length} ítem{items.length !== 1 ? 's' : ''}</span>
            </h3>
            {showItemTable ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showItemTable && (
            <div className="border-t border-surface-700 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Zona</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Subcomponente</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Descripción</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 uppercase font-semibold">M. Obra</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Materiales</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Subtotal</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={`${item.zonaId}-${item.subcomponenteId}`} className="table-row">
                      <td className="px-4 py-3 text-gray-300 text-xs">{item.zonaLabel}</td>
                      <td className="px-4 py-3 text-gray-200 text-xs">{item.subcomponenteLabel}</td>
                      <td className="px-4 py-3">
                        <select
                          className="bg-surface-800 border border-surface-700 rounded px-2 py-1.5 text-xs text-gray-200 min-h-[36px]"
                          value={item.tipoIntervencion}
                          onChange={e => updateItem(idx, 'tipoIntervencion', e.target.value as InterventionType)}
                        >
                          {Object.entries(INTERVENTION_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className="bg-surface-800 border border-surface-700 rounded px-2 py-1.5 text-xs text-gray-200 w-full min-h-[36px]"
                          value={item.descripcion}
                          onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                          placeholder="Detalle adicional..."
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="bg-surface-800 border border-surface-700 rounded px-2 py-1.5 text-xs text-right w-24 min-h-[36px]"
                          value={item.costoManoObra}
                          onChange={e => updateItem(idx, 'costoManoObra', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="bg-surface-800 border border-surface-700 rounded px-2 py-1.5 text-xs text-right w-24 min-h-[36px]"
                          value={item.costoMateriales}
                          onChange={e => updateItem(idx, 'costoMateriales', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono text-xs font-semibold">
                        S/. {(item.costoManoObra + item.costoMateriales).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-400 p-1">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end p-4 border-t border-surface-700">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-mono">S/. {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>IGV (18%)</span>
                    <span className="font-mono">S/. {igv.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg border-t border-surface-700 pt-2">
                    <span>TOTAL</span>
                    <span className="font-mono text-brand-400">S/. {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer options */}
      <div className="card p-4">
        <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
          <span className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-xs">5</span>
          Detalles Adicionales
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Tiempo estimado (días) *</label>
            <input type="number" className="input" min="1" value={meta.tiempoEstimadoDias}
              onChange={e => setMeta(p => ({ ...p, tiempoEstimadoDias: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Validez cotización (días)</label>
            <input type="number" className="input" min="1" value={meta.validezDias}
              onChange={e => setMeta(p => ({ ...p, validezDias: Number(e.target.value) }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Notas / Observaciones</label>
            <textarea className="input resize-none" rows={3} value={meta.notas}
              onChange={e => setMeta(p => ({ ...p, notas: e.target.value }))}
              placeholder="Observaciones adicionales para el cliente o el taller..." />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {items.length === 0 ? 'Selecciona zonas y subcomponentes para agregar ítems' : `${items.length} ítem${items.length !== 1 ? 's' : ''} · Total: S/. ${total.toFixed(2)}`}
        </p>
        <button
          type="submit"
          disabled={mutation.isPending || items.length === 0}
          className={clsx('btn-primary gap-2 px-6', mutation.isPending && 'opacity-70')}
        >
          <FileText size={16} />
          {mutation.isPending ? 'Generando proforma...' : 'Generar Proforma PDF'}
        </button>
      </div>
    </form>
  );
}
