import React, { useState } from 'react';
import clsx from 'clsx';
import { VEHICLE_ZONES_CONFIG } from './vehicleZonesConfig';

type View = 'top' | 'front' | 'rear';

interface VehicleDiagramProps {
  selectedZones: string[];
  onZoneClick: (zoneId: string) => void;
  activeZone?: string;
}

const VIEW_LABELS: Record<View, string> = {
  top: 'Vista Superior',
  front: 'Vista Frontal',
  rear: 'Vista Trasera',
};

export default function VehicleDiagram({ selectedZones, onZoneClick, activeZone }: VehicleDiagramProps) {
  const [view, setView] = useState<View>('top');

  const getZoneClass = (zoneId: string) => {
    const isActive = activeZone === zoneId;
    const isSelected = selectedZones.includes(zoneId);
    if (isActive) return 'fill-brand-500 stroke-brand-300 cursor-pointer opacity-100';
    if (isSelected) return 'fill-brand-700 stroke-brand-500 cursor-pointer opacity-90';
    return 'fill-surface-700 stroke-surface-600 cursor-pointer hover:fill-surface-600 hover:stroke-brand-400 transition-colors';
  };

  const zoneProps = (zoneId: string) => ({
    className: getZoneClass(zoneId),
    onClick: () => onZoneClick(zoneId),
    role: 'button' as const,
    'aria-pressed': selectedZones.includes(zoneId),
    'aria-label': VEHICLE_ZONES_CONFIG.find(z => z.id === zoneId)?.label,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* View Selector */}
      <div className="flex gap-1 bg-surface-800 rounded-lg p-1">
        {(Object.keys(VIEW_LABELS) as View[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx(
              'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
              view === v
                ? 'bg-brand-500 text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-surface-700'
            )}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {/* SVG Diagram */}
      <div className="bg-surface-800 rounded-xl p-4 flex items-center justify-center min-h-[320px]">
        {view === 'top' && <TopViewSVG zoneProps={zoneProps} />}
        {view === 'front' && <FrontViewSVG zoneProps={zoneProps} />}
        {view === 'rear' && <RearViewSVG zoneProps={zoneProps} />}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500 justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-surface-700 border border-surface-600 inline-block" />
          Sin seleccionar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-brand-700 border border-brand-500 inline-block" />
          Seleccionada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-brand-500 border border-brand-300 inline-block" />
          Activa
        </span>
      </div>
    </div>
  );
}

// ─── TOP VIEW (Vista superior del sedan) ───
type ZonePropsGetter = (zoneId: string) => React.SVGProps<SVGPathElement | SVGRectElement | SVGEllipseElement>;

function TopViewSVG({ zoneProps }: { zoneProps: ZonePropsGetter }) {
  return (
    <svg viewBox="0 0 300 500" className="w-full max-w-[220px]" strokeWidth="1.5" strokeLinejoin="round">
      {/* Car body outline */}
      <rect x="30" y="10" width="240" height="480" rx="40" className="fill-surface-900 stroke-surface-600" />

      {/* Capó */}
      <rect x="50" y="20" width="200" height="110" rx="20"
        {...(zoneProps('capo') as React.SVGProps<SVGRectElement>)} />
      <text x="150" y="82" textAnchor="middle" className="fill-gray-300 text-[10px] pointer-events-none select-none" fontSize="10">Capó</text>

      {/* Techo */}
      <rect x="60" y="148" width="180" height="120" rx="8"
        {...(zoneProps('techo') as React.SVGProps<SVGRectElement>)} />
      <text x="150" y="215" textAnchor="middle" className="fill-gray-300 text-[10px] pointer-events-none select-none" fontSize="10">Techo</text>

      {/* Maletero */}
      <rect x="50" y="285" width="200" height="105" rx="20"
        {...(zoneProps('maletero') as React.SVGProps<SVGRectElement>)} />
      <text x="150" y="340" textAnchor="middle" className="fill-gray-300 text-[10px] pointer-events-none select-none" fontSize="10">Maletero</text>

      {/* Aleta delantera izquierda */}
      <path d="M30 70 L50 70 L50 140 L30 140 Q20 140 20 130 L20 80 Q20 70 30 70 Z"
        {...(zoneProps('aleta-del-izq') as React.SVGProps<SVGPathElement>)} />
      <text x="35" y="108" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="7" transform="rotate(-90, 35, 108)">A.D.Izq</text>

      {/* Aleta delantera derecha */}
      <path d="M270 70 L250 70 L250 140 L270 140 Q280 140 280 130 L280 80 Q280 70 270 70 Z"
        {...(zoneProps('aleta-del-der') as React.SVGProps<SVGPathElement>)} />
      <text x="265" y="108" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="7" transform="rotate(90, 265, 108)">A.D.Der</text>

      {/* Puerta delantera izquierda */}
      <rect x="30" y="148" width="28" height="60" rx="3"
        {...(zoneProps('puerta-del-izq') as React.SVGProps<SVGRectElement>)} />
      <text x="44" y="180" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="6" transform="rotate(-90, 44, 180)">P.D.Izq</text>

      {/* Puerta trasera izquierda */}
      <rect x="30" y="212" width="28" height="60" rx="3"
        {...(zoneProps('puerta-tra-izq') as React.SVGProps<SVGRectElement>)} />
      <text x="44" y="244" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="6" transform="rotate(-90, 44, 244)">P.T.Izq</text>

      {/* Puerta delantera derecha */}
      <rect x="242" y="148" width="28" height="60" rx="3"
        {...(zoneProps('puerta-del-der') as React.SVGProps<SVGRectElement>)} />
      <text x="256" y="180" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="6" transform="rotate(90, 256, 180)">P.D.Der</text>

      {/* Puerta trasera derecha */}
      <rect x="242" y="212" width="28" height="60" rx="3"
        {...(zoneProps('puerta-tra-der') as React.SVGProps<SVGRectElement>)} />
      <text x="256" y="244" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="6" transform="rotate(90, 256, 244)">P.T.Der</text>

      {/* Aleta trasera izquierda */}
      <path d="M30 280 L50 280 L50 350 L30 350 Q20 350 20 340 L20 290 Q20 280 30 280 Z"
        {...(zoneProps('aleta-tra-izq') as React.SVGProps<SVGPathElement>)} />
      <text x="35" y="318" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="7" transform="rotate(-90, 35, 318)">A.T.Izq</text>

      {/* Aleta trasera derecha */}
      <path d="M270 280 L250 280 L250 350 L270 350 Q280 350 280 340 L280 290 Q280 280 270 280 Z"
        {...(zoneProps('aleta-tra-der') as React.SVGProps<SVGPathElement>)} />
      <text x="265" y="318" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="7" transform="rotate(90, 265, 318)">A.T.Der</text>

      {/* Wheels (decorative) */}
      <ellipse cx="42" cy="60" rx="18" ry="12" className="fill-surface-950 stroke-surface-600" />
      <ellipse cx="258" cy="60" rx="18" ry="12" className="fill-surface-950 stroke-surface-600" />
      <ellipse cx="42" cy="435" rx="18" ry="12" className="fill-surface-950 stroke-surface-600" />
      <ellipse cx="258" cy="435" rx="18" ry="12" className="fill-surface-950 stroke-surface-600" />
    </svg>
  );
}

// ─── FRONT VIEW ───
function FrontViewSVG({ zoneProps }: { zoneProps: ZonePropsGetter }) {
  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-[320px]" strokeWidth="1.5" strokeLinejoin="round">
      {/* Body */}
      <path d="M60 280 L60 120 Q60 80 100 70 L150 50 L250 50 L300 70 Q340 80 340 120 L340 280 Z"
        className="fill-surface-900 stroke-surface-600" />

      {/* Parachoque delantero */}
      <path d="M70 250 L70 280 Q70 295 85 295 L315 295 Q330 295 330 280 L330 250 Z"
        {...(zoneProps('bumper-del') as React.SVGProps<SVGPathElement>)} />
      <text x="200" y="275" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="9">Parachoque Delantero</text>

      {/* Grille */}
      <rect x="140" y="210" width="120" height="36" rx="6"
        {...(zoneProps('grille') as React.SVGProps<SVGRectElement>)} />
      <text x="200" y="233" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="8">Grille</text>

      {/* Capó */}
      <path d="M80 200 L80 120 Q80 80 110 72 L150 65 L250 65 L290 72 Q320 80 320 120 L320 200 Z"
        {...(zoneProps('capo') as React.SVGProps<SVGPathElement>)} />
      <text x="200" y="145" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="10">Capó</text>

      {/* Faro izquierdo */}
      <path d="M75 160 L75 210 L135 210 L135 165 Q130 155 110 155 L85 157 Z"
        {...(zoneProps('faro-del-izq') as React.SVGProps<SVGPathElement>)} />
      <text x="105" y="190" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="7">F.Izq</text>

      {/* Faro derecho */}
      <path d="M325 160 L325 210 L265 210 L265 165 Q270 155 290 155 L315 157 Z"
        {...(zoneProps('faro-del-der') as React.SVGProps<SVGPathElement>)} />
      <text x="295" y="190" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="7">F.Der</text>

      {/* Espejo izquierdo */}
      <ellipse cx="55" cy="140" rx="18" ry="10"
        {...(zoneProps('espejo-izq') as React.SVGProps<SVGEllipseElement>)} />
      <text x="55" y="143" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="5">Esp.I</text>

      {/* Espejo derecho */}
      <ellipse cx="345" cy="140" rx="18" ry="10"
        {...(zoneProps('espejo-der') as React.SVGProps<SVGEllipseElement>)} />
      <text x="345" y="143" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="5">Esp.D</text>

      {/* Windshield */}
      <path d="M100 65 L100 40 Q100 20 150 15 L250 15 Q300 20 300 40 L300 65 Z"
        className="fill-sky-900/40 stroke-surface-600" />
    </svg>
  );
}

// ─── REAR VIEW ───
function RearViewSVG({ zoneProps }: { zoneProps: ZonePropsGetter }) {
  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-[320px]" strokeWidth="1.5" strokeLinejoin="round">
      {/* Body */}
      <path d="M60 280 L60 120 Q60 80 100 70 L150 50 L250 50 L300 70 Q340 80 340 120 L340 280 Z"
        className="fill-surface-900 stroke-surface-600" />

      {/* Parachoque trasero */}
      <path d="M70 250 L70 280 Q70 295 85 295 L315 295 Q330 295 330 280 L330 250 Z"
        {...(zoneProps('bumper-tra') as React.SVGProps<SVGPathElement>)} />
      <text x="200" y="275" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="9">Parachoque Trasero</text>

      {/* Maletero */}
      <path d="M90 120 L90 250 L310 250 L310 120 Q310 95 280 85 L200 80 L120 85 Q90 95 90 120 Z"
        {...(zoneProps('maletero') as React.SVGProps<SVGPathElement>)} />
      <text x="200" y="175" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="10">Maletero</text>

      {/* Faro trasero izquierdo */}
      <path d="M72 160 L72 225 L120 225 L120 165 Q115 155 95 155 L80 157 Z"
        {...(zoneProps('faro-tra-izq') as React.SVGProps<SVGPathElement>)} />
      <text x="96" y="195" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="7">F.T.Izq</text>

      {/* Faro trasero derecho */}
      <path d="M328 160 L328 225 L280 225 L280 165 Q285 155 305 155 L320 157 Z"
        {...(zoneProps('faro-tra-der') as React.SVGProps<SVGPathElement>)} />
      <text x="304" y="195" textAnchor="middle" className="fill-gray-300 pointer-events-none select-none" fontSize="7">F.T.Der</text>

      {/* Rear window */}
      <path d="M105 50 L105 30 Q105 15 150 10 L250 10 Q295 15 295 30 L295 50 Z"
        className="fill-sky-900/40 stroke-surface-600" />
    </svg>
  );
}
