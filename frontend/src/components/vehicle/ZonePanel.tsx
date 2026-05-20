import React from 'react';
import { X, CheckSquare, Square, ShieldAlert } from 'lucide-react';
import { InterventionType, INTERVENTION_LABELS } from '@autobody/shared';
import { ZONE_BY_ID } from './vehicleZonesConfig';
import clsx from 'clsx';

interface SelectedSubcomponent {
  zonaId: string;
  subcomponenteId: string;
  tipoIntervencion: InterventionType;
}

interface ZonePanelProps {
  zoneId: string | null;
  selectedSubcomponents: SelectedSubcomponent[];
  onToggleSubcomponent: (zonaId: string, subcomponenteId: string, tipo: InterventionType) => void;
  onClose: () => void;
}

const INTERVENTION_OPTIONS = Object.entries(INTERVENTION_LABELS) as [InterventionType, string][];

// Configuración de colores HSL premium y etiquetas para cada tipo de intervención
const CHIP_CONFIGS: Record<InterventionType, { label: string; bg: string; border: string; text: string; activeBg: string }> = {
  PLANCHADO: {
    label: 'Planchado',
    bg: 'bg-orange-500/5 hover:bg-orange-500/15',
    border: 'border-orange-500/20 hover:border-orange-500/40',
    text: 'text-orange-400',
    activeBg: 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20 font-bold',
  },
  MASILLA_Y_PINTURA: {
    label: 'Masilla + Pint.',
    bg: 'bg-amber-500/5 hover:bg-amber-500/15',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    text: 'text-amber-400',
    activeBg: 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20 font-bold',
  },
  PINTURA_SOLAMENTE: {
    label: 'Pintura',
    bg: 'bg-rose-500/5 hover:bg-rose-500/15',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    text: 'text-rose-400',
    activeBg: 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20 font-bold',
  },
  REEMPLAZO: {
    label: 'Reemplazo',
    bg: 'bg-cyan-500/5 hover:bg-cyan-500/15',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    text: 'text-cyan-400',
    activeBg: 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20 font-bold',
  },
  REPARACION: {
    label: 'Reparación',
    bg: 'bg-purple-500/5 hover:bg-purple-500/15',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    text: 'text-purple-400',
    activeBg: 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20 font-bold',
  },
  REVISION_DIAGNOSTICO: {
    label: 'Diagnóstico',
    bg: 'bg-emerald-500/5 hover:bg-emerald-500/15',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    text: 'text-emerald-400',
    activeBg: 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold',
  },
  LIMPIEZA_DETAILING: {
    label: 'Detailing',
    bg: 'bg-violet-500/5 hover:bg-violet-500/15',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    text: 'text-violet-400',
    activeBg: 'bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-500/20 font-bold',
  },
};

export default function ZonePanel({ zoneId, selectedSubcomponents, onToggleSubcomponent, onClose }: ZonePanelProps) {
  const [defaultTipo, setDefaultTipo] = React.useState<InterventionType>('PLANCHADO');
  const zone = zoneId ? ZONE_BY_ID[zoneId] : null;

  if (!zone) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center min-h-[380px] text-center bg-gradient-to-b from-surface-900 to-surface-950 border border-surface-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(#2a2a2a_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
        <div className="w-16 h-16 bg-surface-800 border border-surface-700/60 rounded-2xl flex items-center justify-center mb-4 shadow-inner text-2xl transition-transform duration-300 group-hover:scale-110">
          🚗
        </div>
        <h4 className="text-white font-semibold text-sm mb-1">Sin Zona Seleccionada</h4>
        <p className="text-gray-400 text-xs max-w-[200px] leading-relaxed">
          Haz clic sobre cualquier área en el diagrama del vehículo para ver y editar sus subcomponentes.
        </p>
      </div>
    );
  }

  const isSubSelected = (subId: string) =>
    selectedSubcomponents.some(s => s.zonaId === zoneId && s.subcomponenteId === subId);

  return (
    <div className="card flex flex-col h-full bg-surface-900 border border-surface-800 shadow-2xl overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-800 bg-surface-950/40">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Zona Activa</p>
          <h3 className="font-bold text-white text-base leading-tight mt-0.5">{zone.label}</h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface-800 transition-all duration-200">
          <X size={16} />
        </button>
      </div>

      {/* Default Intervention Helper */}
      <div className="p-4 border-b border-surface-800 bg-surface-900/30">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] bg-brand-500/10 text-brand-400 px-1.5 py-0.5 rounded border border-brand-500/20 font-bold uppercase tracking-wider">Default</span>
          <p className="text-[11px] text-gray-400 font-semibold">Tipo por defecto para nueva selección</p>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {INTERVENTION_OPTIONS.map(([tipo, label]) => {
            const isCurrent = defaultTipo === tipo;
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => setDefaultTipo(tipo)}
                className={clsx(
                  'text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border min-h-[32px]',
                  isCurrent
                    ? 'bg-brand-500/10 border-brand-500 text-brand-300 shadow-sm shadow-brand-500/5'
                    : 'bg-surface-950/40 border-surface-800 text-gray-400 hover:border-surface-700 hover:text-gray-300'
                )}
              >
                {label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcomponents list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[350px]">
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-2">
          Subcomponentes ({zone.subcomponents.length})
        </p>
        <div className="flex flex-col gap-2">
          {zone.subcomponents.map(sub => {
            const selected = isSubSelected(sub.id);
            const existing = selectedSubcomponents.find(
              s => s.zonaId === zoneId && s.subcomponenteId === sub.id
            );

            return (
              <div
                key={sub.id}
                className={clsx(
                  'flex flex-col rounded-xl border transition-all duration-300 overflow-hidden',
                  selected
                    ? 'bg-surface-950/60 border-surface-700 shadow-lg'
                    : 'bg-surface-950/20 border-surface-850 hover:border-surface-750 hover:bg-surface-950/40'
                )}
              >
                {/* Main Row / Header */}
                <button
                  type="button"
                  onClick={() => onToggleSubcomponent(zone.id, sub.id, defaultTipo)}
                  className="flex items-center gap-3 px-3 py-3 w-full text-left text-sm transition-all focus:outline-none min-h-[44px]"
                >
                  <span className={clsx(
                    'flex-shrink-0 transition-transform duration-200',
                    selected ? 'text-brand-500 scale-100' : 'text-gray-600 scale-95'
                  )}>
                    {selected ? (
                      <CheckSquare size={16} className="fill-brand-500/10 text-brand-500" />
                    ) : (
                      <Square size={16} className="text-surface-600" />
                    )}
                  </span>
                  <span className={clsx(
                    'flex-1 text-[13px] font-semibold leading-normal transition-colors duration-200',
                    selected ? 'text-white' : 'text-gray-300'
                  )}>
                    {sub.label}
                  </span>
                  {selected && existing && (
                    <span className={clsx(
                      'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shadow-sm font-mono',
                      CHIP_CONFIGS[existing.tipoIntervencion].text,
                      CHIP_CONFIGS[existing.tipoIntervencion].bg,
                      CHIP_CONFIGS[existing.tipoIntervencion].border
                    )}>
                      {CHIP_CONFIGS[existing.tipoIntervencion].label.split(' ')[0]}
                    </span>
                  )}
                </button>

                {/* Expanded Section with Intervention Chips (Only visible if selected) */}
                {selected && existing && (
                  <div className="px-3 pb-3 pt-1 bg-surface-950/30 border-t border-surface-900/60 transition-all duration-300">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2">
                      Selecciona Tipo de Intervención:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {INTERVENTION_OPTIONS.map(([tipo, label]) => {
                        const isChipActive = existing.tipoIntervencion === tipo;
                        const config = CHIP_CONFIGS[tipo];
                        return (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() => onToggleSubcomponent(zone.id, sub.id, tipo)}
                            className={clsx(
                              'px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border transition-all duration-200 focus:outline-none min-h-[26px]',
                              isChipActive
                                ? config.activeBg
                                : clsx(config.bg, config.border, config.text)
                            )}
                            title={label}
                          >
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

