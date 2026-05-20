import React from 'react';
import { X, CheckSquare, Square } from 'lucide-react';
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

export default function ZonePanel({ zoneId, selectedSubcomponents, onToggleSubcomponent, onClose }: ZonePanelProps) {
  const [selectedTipo, setSelectedTipo] = React.useState<InterventionType>('PLANCHADO');
  const zone = zoneId ? ZONE_BY_ID[zoneId] : null;

  if (!zone) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center min-h-[320px] text-center">
        <div className="text-4xl mb-3">🚗</div>
        <p className="text-gray-400 text-sm">Selecciona una zona del vehículo<br />para ver sus subcomponentes</p>
      </div>
    );
  }

  const isSubSelected = (subId: string) =>
    selectedSubcomponents.some(s => s.zonaId === zoneId && s.subcomponenteId === subId);

  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-700">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Zona seleccionada</p>
          <h3 className="font-semibold text-white">{zone.label}</h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
          <X size={16} />
        </button>
      </div>

      {/* Intervention Type Selector */}
      <div className="p-4 border-b border-surface-700">
        <p className="label">Tipo de intervención a aplicar</p>
        <div className="grid grid-cols-2 gap-1.5">
          {INTERVENTION_OPTIONS.map(([tipo, label]) => (
            <button
              key={tipo}
              onClick={() => setSelectedTipo(tipo)}
              className={clsx(
                'text-left px-3 py-2 rounded-lg text-xs transition-all border',
                selectedTipo === tipo
                  ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                  : 'bg-surface-800 border-surface-700 text-gray-400 hover:border-surface-600'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Subcomponents */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="label mb-2">Subcomponentes ({zone.subcomponents.length})</p>
        <div className="flex flex-col gap-1.5">
          {zone.subcomponents.map(sub => {
            const selected = isSubSelected(sub.id);
            const existing = selectedSubcomponents.find(
              s => s.zonaId === zoneId && s.subcomponenteId === sub.id
            );
            return (
              <button
                key={sub.id}
                onClick={() => onToggleSubcomponent(zone.id, sub.id, selectedTipo)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-left transition-all border min-h-[44px]',
                  selected
                    ? 'bg-brand-500/15 border-brand-500/50 text-white'
                    : 'bg-surface-800 border-surface-700 text-gray-300 hover:border-surface-600 hover:text-white'
                )}
              >
                <span className="flex-shrink-0 text-brand-500">
                  {selected ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-500" />}
                </span>
                <span className="flex-1">{sub.label}</span>
                {selected && existing && (
                  <span className="text-[10px] text-brand-400 flex-shrink-0 font-medium">
                    {INTERVENTION_LABELS[existing.tipoIntervencion].split(' ')[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
