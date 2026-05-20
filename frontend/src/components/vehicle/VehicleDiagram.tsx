import React, { useState } from 'react';
import clsx from 'clsx';
import { VEHICLE_ZONES_CONFIG } from './vehicleZonesConfig';
import { InterventionType } from '@autobody/shared';

type View = 'top' | 'front' | 'rear';

interface SelectedSubcomponent {
  zonaId: string;
  subcomponenteId: string;
  tipoIntervencion: InterventionType;
}

interface VehicleDiagramProps {
  selectedZones: string[];
  onZoneClick: (zoneId: string) => void;
  activeZone?: string | null;
  selectedSubcomponents?: SelectedSubcomponent[];
}

const VIEW_LABELS: Record<View, string> = {
  top: 'Vista Superior',
  front: 'Vista Frontal',
  rear: 'Vista Trasera',
};

export default function VehicleDiagram({
  selectedZones,
  onZoneClick,
  activeZone,
  selectedSubcomponents = [],
}: VehicleDiagramProps) {
  const [view, setView] = useState<View>('top');

  const getSelectedCountForView = (v: View) => {
    const zonesForView = VEHICLE_ZONES_CONFIG.filter(z => z.view === v).map(z => z.id);
    return selectedSubcomponents.filter(s => zonesForView.includes(s.zonaId)).length;
  };

  const getSubcomponentCountForZone = (zoneId: string) => {
    return selectedSubcomponents.filter(s => s.zonaId === zoneId).length;
  };

  const getZoneClass = (zoneId: string) => {
    const isActive = activeZone === zoneId;
    const isSelected = selectedZones.includes(zoneId);
    
    if (isActive) {
      return 'fill-brand-500/40 stroke-brand-400 cursor-pointer opacity-100 transition-all duration-300';
    }
    if (isSelected) {
      return 'fill-brand-600/20 stroke-brand-500/80 cursor-pointer opacity-95 transition-all duration-300';
    }
    return 'fill-surface-900/45 stroke-surface-700/80 cursor-pointer hover:fill-brand-500/15 hover:stroke-brand-500/60 transition-all duration-300';
  };

  const zoneProps = (zoneId: string) => ({
    className: getZoneClass(zoneId),
    onClick: () => onZoneClick(zoneId),
    role: 'button' as const,
    style: {
      filter: activeZone === zoneId 
        ? 'url(#glow-active)' 
        : selectedZones.includes(zoneId) 
          ? 'url(#glow-selected)' 
          : 'none',
    },
    'aria-pressed': selectedZones.includes(zoneId),
    'aria-label': VEHICLE_ZONES_CONFIG.find(z => z.id === zoneId)?.label,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* View Selector with interactive count badges */}
      <div className="flex gap-2 bg-surface-900 border border-surface-800 rounded-xl p-1.5 shadow-inner">
        {(Object.keys(VIEW_LABELS) as View[]).map(v => {
          const count = getSelectedCountForView(v);
          const isCurrent = view === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 min-h-[40px]',
                isCurrent
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/15 border border-brand-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-800 border border-transparent'
              )}
            >
              <span>{VIEW_LABELS[v]}</span>
              {count > 0 && (
                <span className={clsx(
                  'inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full transition-all duration-200',
                  isCurrent ? 'bg-white text-brand-600' : 'bg-brand-500 text-white'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SVG Diagram with realistic vehicle vector outline */}
      <div className="bg-gradient-to-b from-surface-900 to-surface-950 border border-surface-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[380px] shadow-2xl relative overflow-hidden group">
        {/* Glow grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

        {view === 'top' && (
          <TopViewSVG 
            zoneProps={zoneProps} 
            getCount={getSubcomponentCountForZone} 
            activeZone={activeZone}
          />
        )}
        {view === 'front' && (
          <FrontViewSVG 
            zoneProps={zoneProps} 
            getCount={getSubcomponentCountForZone} 
            activeZone={activeZone}
          />
        )}
        {view === 'rear' && (
          <RearViewSVG 
            zoneProps={zoneProps} 
            getCount={getSubcomponentCountForZone} 
            activeZone={activeZone}
          />
        )}
      </div>

      {/* Legend with gorgeous custom icons */}
      <div className="flex gap-6 text-[11px] font-medium text-gray-400 justify-center bg-surface-900/40 border border-surface-800/40 py-2.5 rounded-xl">
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-surface-900 border border-surface-700 shadow-inner" />
          Sin daños
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-brand-500/10 border border-brand-500/50 shadow-sm" />
          Con daños
        </span>
        <span className="flex items-center gap-2 text-brand-400">
          <span className="w-3.5 h-3.5 rounded-md bg-brand-500/30 border border-brand-400 shadow-glow" />
          Zona activa
        </span>
      </div>
    </div>
  );
}

// Helper component for count badge on SVG
function SVGZoneBadge({ cx, cy, count }: { cx: number; cy: number; count: number }) {
  if (count <= 0) return null;
  return (
    <g className="pointer-events-none transition-all duration-300 transform scale-100 hover:scale-110">
      {/* Outer ripple */}
      <circle cx={cx} cy={cy} r={10} className="fill-brand-500/20 stroke-brand-500/30 stroke-1 animate-ping" />
      {/* Badge container */}
      <circle cx={cx} cy={cy} r={8.5} className="fill-brand-500 stroke-surface-950 stroke-1.5 shadow-md shadow-brand-500/20" />
      <text 
        x={cx} 
        y={cy + 3} 
        textAnchor="middle" 
        className="fill-white font-mono text-[9px] font-black select-none pointer-events-none"
      >
        {count}
      </text>
    </g>
  );
}

type ZonePropsGetter = (zoneId: string) => React.SVGProps<SVGPathElement | SVGRectElement | SVGEllipseElement>;

interface ViewSVGProps {
  zoneProps: ZonePropsGetter;
  getCount: (zoneId: string) => number;
  activeZone?: string | null;
}

// ─── TOP VIEW (Silueta Premium de Sedan Vista de Planta) ───
function TopViewSVG({ zoneProps, getCount, activeZone }: ViewSVGProps) {
  return (
    <svg viewBox="0 0 320 520" className="w-full max-w-[240px] drop-shadow-2xl" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <defs>
        {/* Glow filter definitions */}
        <filter id="glow-active" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComponentTransfer in="blur" result="boost">
            <feFuncA type="linear" slope="1.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="boost" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-selected" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Linear Gradients for premium vehicle look */}
        <linearGradient id="body-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e2025" />
          <stop offset="50%" stopColor="#2c3038" />
          <stop offset="100%" stopColor="#1e2025" />
        </linearGradient>
        <linearGradient id="glass-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#16384c" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#081a24" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Ruedas traseras y delanteras (Detalles decorativos realistas en color oscuro) */}
      <rect x="22" y="70" width="16" height="40" rx="4" className="fill-surface-950 stroke-surface-850" />
      <rect x="282" y="70" width="16" height="40" rx="4" className="fill-surface-950 stroke-surface-850" />
      <rect x="20" y="380" width="18" height="44" rx="4" className="fill-surface-950 stroke-surface-850" />
      <rect x="282" y="380" width="18" height="44" rx="4" className="fill-surface-950 stroke-surface-850" />

      {/* Silueta exterior total del auto (Sombra y contorno de fondo premium con curvas aerodinámicas de sedán deportivo) */}
      <path 
        d="M 160 25 C 120 25, 78 30, 68 45 C 56 60, 52 80, 52 110 C 52 135, 54 150, 54 165 C 54 175, 50 178, 50 230 C 50 282, 54 290, 54 300 C 54 315, 50 335, 50 375 C 50 415, 54 440, 68 475 C 78 495, 120 500, 160 500 C 200 500, 242 495, 252 475 C 266 440, 270 415, 270 375 C 270 335, 266 315, 266 300 C 266 290, 270 282, 270 230 C 270 178, 266 175, 266 165 C 266 150, 268 135, 268 110 C 268 80, 264 60, 252 45 C 242 30, 200 25, 160 25 Z" 
        className="fill-surface-950 stroke-surface-800" 
        strokeWidth="2.5"
      />

      {/* ──────────────── CLICABLES: CAPÓ (Corte aerodinámico con curvas del pilar A) ──────────────── */}
      <path 
        d="M 80 43 C 100 37, 130 35, 160 35 C 190 35, 220 37, 240 43 C 248 55, 254 85, 256 122 C 220 126, 180 128, 160 128 C 140 128, 100 126, 64 122 C 66 85, 72 55, 80 43 Z"
        {...(zoneProps('capo') as React.SVGProps<SVGPathElement>)}
      />
      <text x="160" y="80" textAnchor="middle" className="fill-gray-400/90 font-sans font-bold text-[10px] tracking-wider pointer-events-none select-none">CAPÓ</text>

      {/* ──────────────── CLICABLES: ALETA DELANTERA IZQUIERDA (Guardabarros curvo sobre la rueda) ──────────────── */}
      <path 
        d="M 68 45 C 56 60, 52 80, 52 110 C 52 118, 53 121, 54 122 L 64 122 C 66 85, 72 55, 80 43 C 76 43, 72 44, 68 45 Z"
        {...(zoneProps('aleta-del-izq') as React.SVGProps<SVGPathElement>)}
      />
      <text x="56" y="85" textAnchor="middle" className="fill-gray-400/80 font-sans font-semibold text-[8px] pointer-events-none select-none" transform="rotate(-90, 56, 85)">A.D. IZQ</text>

      {/* ──────────────── CLICABLES: ALETA DELANTERA DERECHA (Sintonia exacta) ──────────────── */}
      <path 
        d="M 252 45 C 264 60, 268 80, 268 110 C 268 118, 267 121, 266 122 L 256 122 C 254 85, 248 55, 240 43 C 244 43, 248 44, 252 45 Z"
        {...(zoneProps('aleta-del-der') as React.SVGProps<SVGPathElement>)}
      />
      <text x="264" y="85" textAnchor="middle" className="fill-gray-400/80 font-sans font-semibold text-[8px] pointer-events-none select-none" transform="rotate(90, 264, 85)">A.D. DER</text>

      {/* Parabrisas delantero (Estilo deportivo vidriado con curva envolvente) */}
      <path d="M 82 128 C 110 124, 210 124, 238 128 C 248 142, 248 162, 244 165 C 220 158, 100 158, 76 165 C 72 162, 72 142, 82 128 Z" fill="url(#glass-grad)" className="stroke-surface-850" strokeWidth="1" />

      {/* Espejos Retrovisores (Curva moderna aerodinámica) */}
      <path d="M 50 148 C 36 142, 34 135, 42 135 C 48 135, 52 140, 54 148 Z" className="fill-surface-800 stroke-surface-700" />
      <path d="M 270 148 C 284 142, 286 135, 278 135 C 272 135, 268 140, 266 148 Z" className="fill-surface-800 stroke-surface-700" />

      {/* ──────────────── CLICABLES: TECHO (Sección central del habitáculo) ──────────────── */}
      <path 
        d="M 96 174 C 115 168, 205 168, 224 174 C 238 182, 240 210, 240 235 C 240 260, 238 288, 224 296 C 205 302, 115 302, 96 296 C 82 288, 80 260, 80 235 C 80 210, 82 182, 96 174 Z"
        {...(zoneProps('techo') as React.SVGProps<SVGPathElement>)}
      />
      <text x="160" y="235" textAnchor="middle" className="fill-gray-400/90 font-sans font-bold text-[10px] tracking-wider pointer-events-none select-none">TECHO</text>

      {/* ──────────────── CLICABLES: PUERTAS DELANTERAS (Curva exterior envolvente) ──────────────── */}
      {/* Puerta Delantera Izquierda */}
      <path 
        d="M 54 122 L 76 138 C 76 150, 80 162, 80 174 C 80 195, 80 215, 80 230 L 50 230 C 50 195, 52 160, 54 122 Z"
        {...(zoneProps('puerta-del-izq') as React.SVGProps<SVGPathElement>)}
      />
      <text x="61" y="195" textAnchor="middle" className="fill-gray-450 font-sans font-semibold text-[8px] pointer-events-none select-none" transform="rotate(-90, 61, 195)">P.D. IZQ</text>
      
      {/* Puerta Delantera Derecha */}
      <path 
        d="M 266 122 L 244 138 C 244 150, 240 162, 240 174 C 240 195, 240 215, 240 230 L 270 230 C 270 195, 268 160, 266 122 Z"
        {...(zoneProps('puerta-del-der') as React.SVGProps<SVGPathElement>)}
      />
      <text x="259" y="195" textAnchor="middle" className="fill-gray-450 font-sans font-semibold text-[8px] pointer-events-none select-none" transform="rotate(90, 259, 195)">P.D. DER</text>

      {/* ──────────────── CLICABLES: PUERTAS TRASERAS (Integradas al pilar C) ──────────────── */}
      {/* Puerta Trasera Izquierda */}
      <path 
        d="M 50 230 L 80 230 C 80 250, 80 275, 80 296 L 76 302 L 54 300 C 52 288, 50 262, 50 230 Z"
        {...(zoneProps('puerta-tra-izq') as React.SVGProps<SVGPathElement>)}
      />
      <text x="61" y="262" textAnchor="middle" className="fill-gray-450 font-sans font-semibold text-[8px] pointer-events-none select-none" transform="rotate(-90, 61, 262)">P.T. IZQ</text>

      {/* Puerta Trasera Derecha */}
      <path 
        d="M 270 230 L 240 230 C 240 250, 240 275, 240 296 L 244 302 L 266 300 C 268 288, 270 262, 270 230 Z"
        {...(zoneProps('puerta-tra-der') as React.SVGProps<SVGPathElement>)}
      />
      <text x="259" y="262" textAnchor="middle" className="fill-gray-450 font-sans font-semibold text-[8px] pointer-events-none select-none" transform="rotate(90, 259, 262)">P.T. DER</text>

      {/* Luna Trasera (Detalle decorativo vidriado) */}
      <path d="M 82 296 C 100 300, 220 300, 238 296 C 244 310, 244 322, 238 326 C 220 322, 100 322, 82 326 C 76 322, 76 310, 82 296 Z" fill="url(#glass-grad)" className="stroke-surface-850" strokeWidth="1" />

      {/* ──────────────── CLICABLES: MALETERO ──────────────── */}
      <path 
        d="M 82 326 C 100 322, 220 322, 238 326 C 244 340, 246 375, 246 435 C 200 440, 120 440, 74 435 C 74 375, 76 340, 82 326 Z"
        {...(zoneProps('maletero') as React.SVGProps<SVGPathElement>)}
      />
      <text x="160" y="385" textAnchor="middle" className="fill-gray-400/90 font-sans font-bold text-[10px] tracking-wider pointer-events-none select-none">MALETERO</text>

      {/* ──────────────── CLICABLES: ALETA TRASERA IZQUIERDA (Cadera ensanchada/deportiva) ──────────────── */}
      <path 
        d="M 54 300 L 76 302 L 82 326 L 74 435 C 62 440, 54 435, 52 425 C 50 415, 50 375, 50 375 C 50 335, 54 315, 54 300 Z"
        {...(zoneProps('aleta-tra-izq') as React.SVGProps<SVGPathElement>)}
      />
      <text x="57" y="360" textAnchor="middle" className="fill-gray-400/80 font-sans font-semibold text-[8px] pointer-events-none select-none" transform="rotate(-90, 57, 360)">A.T. IZQ</text>

      {/* ──────────────── CLICABLES: ALETA TRASERA DERECHA (Simétrico) ──────────────── */}
      <path 
        d="M 266 300 L 244 302 L 238 326 L 246 435 C 258 440, 266 435, 268 425 C 270 415, 270 375, 270 375 C 270 335, 266 315, 266 300 Z"
        {...(zoneProps('aleta-tra-der') as React.SVGProps<SVGPathElement>)}
      />
      <text x="263" y="360" textAnchor="middle" className="fill-gray-400/80 font-sans font-semibold text-[8px] pointer-events-none select-none" transform="rotate(90, 263, 360)">A.T. DER</text>

      {/* Parachoque trasero base (Decorativo en la vista superior) */}
      <path d="M 68 475 C 78 495, 120 500, 160 500 C 200 500, 242 495, 252 475 L 246 435 C 200 440, 120 440, 74 435 Z" fill="none" className="stroke-surface-700" strokeWidth="1.2" />

      {/* ─── DETALLES VECTORIALES DE ALTA FIDELIDAD (Capa de Realismo Premium - pointer-events-none) ─── */}
      <g className="pointer-events-none stroke-surface-700/60 fill-none" strokeWidth="1">
        {/* Reflejos en el parabrisas */}
        <path d="M 96 135 L 125 158 M 165 132 L 210 158" className="stroke-surface-500/20" strokeWidth="1.5" />
        {/* Parabrisas Wipers */}
        <path d="M 105 131 L 140 126 M 165 131 L 200 126" className="stroke-surface-600" strokeWidth="1.5" strokeLinecap="round" />
        {/* Manijas de puertas con diseño embutido de lujo */}
        <rect x="52" y="210" width="1.5" height="12" rx="0.5" className="fill-surface-800 stroke-surface-650" />
        <rect x="266.5" y="210" width="1.5" height="12" rx="0.5" className="fill-surface-800 stroke-surface-650" />
        <rect x="52" y="270" width="1.5" height="12" rx="0.5" className="fill-surface-800 stroke-surface-650" />
        <rect x="266.5" y="270" width="1.5" height="12" rx="0.5" className="fill-surface-800 stroke-surface-650" />
        
        {/* Techo Panorámico de Cristal */}
        <rect x="100" y="190" width="120" height="70" rx="6" className="stroke-surface-700/50" />
        <line x1="160" y1="190" x2="160" y2="260" className="stroke-surface-700/35" />
        
        {/* Cocadas y labrado realista de los neumáticos */}
        <path d="M 22 75 L 38 75 M 22 85 L 38 85 M 22 95 L 38 95 M 282 75 L 298 75 M 282 85 L 298 85 M 282 95 L 298 95 M 20 385 L 38 385 M 20 395 L 38 395 M 20 405 L 38 405 M 282 385 L 300 385 M 282 395 L 300 395 M 282 405 L 300 405" className="stroke-surface-800" strokeWidth="1.2" />
        
        {/* Nervaduras de carácter sobre el capó */}
        <path d="M 115 37 C 122 65, 126 95, 122 124 M 205 37 C 198 65, 194 95, 198 124" className="stroke-surface-700/40" strokeWidth="1" />
        <path d="M 135 35 C 138 65, 140 95, 138 126 M 185 35 C 182 65, 180 95, 182 126" className="stroke-surface-700/25" strokeWidth="1" />
        
        {/* Faros delanteros que se asoman en planta */}
        <path d="M 54 44 L 64 70 M 266 44 L 256 70" className="stroke-surface-600/40" />
        
        {/* Tapa de Combustible */}
        <circle cx="258" cy="415" r="4.5" className="stroke-surface-700 fill-none" />
      </g>

      {/* 🔴 BADGES DINÁMICOS CON CONTEO DE DAÑOS SOBRE EL SVG 🔴 */}
      <SVGZoneBadge cx={160} cy={60} count={getCount('capo')} />
      <SVGZoneBadge cx={66} cy={95} count={getCount('aleta-del-izq')} />
      <SVGZoneBadge cx={254} cy={95} count={getCount('aleta-del-der')} />
      <SVGZoneBadge cx={160} cy={205} count={getCount('techo')} />
      <SVGZoneBadge cx={54} cy={195} count={getCount('puerta-del-izq')} />
      <SVGZoneBadge cx={266} cy={195} count={getCount('puerta-del-der')} />
      <SVGZoneBadge cx={54} cy={260} count={getCount('puerta-tra-izq')} />
      <SVGZoneBadge cx={266} cy={260} count={getCount('puerta-tra-der')} />
      <SVGZoneBadge cx={160} cy={355} count={getCount('maletero')} />
      <SVGZoneBadge cx={58} cy={360} count={getCount('aleta-tra-izq')} />
      <SVGZoneBadge cx={262} cy={360} count={getCount('aleta-tra-der')} />
    </svg>
  );
}

// ─── FRONT VIEW (Silueta Premium de Frente) ───
function FrontViewSVG({ zoneProps, getCount, activeZone }: ViewSVGProps) {
  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-[300px] drop-shadow-2xl" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <linearGradient id="grille-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#15171c" />
          <stop offset="100%" stopColor="#0d0e12" />
        </linearGradient>
        <linearGradient id="headlight-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Ruedas visibles abajo (Detalles decorativos anchos) */}
      <rect x="58" y="235" width="26" height="50" rx="5" className="fill-surface-950 stroke-surface-850" />
      <rect x="316" y="235" width="26" height="50" rx="5" className="fill-surface-950 stroke-surface-850" />

      {/* Silueta exterior de fondo premium, ancha en la base y aerodinámica en los pilares */}
      <path 
        d="M 50 255 L 50 140 C 50 140, 52 85, 110 68 C 130 63, 270 63, 290 68 C 348 85, 350 140, 350 255 Z"
        className="fill-surface-950 stroke-surface-800"
        strokeWidth="2.5"
      />

      {/* Parabrisas delantero (Estilo deportivo curvado con espejo retrovisor interior) */}
      <path d="M 98 122 C 120 114, 280 114, 302 122 L 284 72 C 260 67, 140 67, 116 72 Z" fill="url(#glass-grad)" className="stroke-surface-850" />

      {/* Espejos Retrovisores (Forma realista de flecha deportiva) */}
      <path d="M 46 128 C 32 118, 28 128, 38 132 C 44 132, 48 128, 48 128 Z" className="fill-surface-800 stroke-surface-700" />
      <path d="M 354 128 C 368 118, 372 128, 362 132 C 356 132, 352 128, 352 128 Z" className="fill-surface-800 stroke-surface-700" />

      {/* ──────────────── CLICABLES: CAPÓ (Músculo deportivo de frente) ──────────────── */}
      <path 
        d="M 98 125 C 130 118, 270 118, 302 125 C 316 155, 322 178, 324 195 L 76 195 C 78 178, 84 155, 98 125 Z"
        {...(zoneProps('capo') as React.SVGProps<SVGPathElement>)}
      />
      <text x="200" y="165" textAnchor="middle" className="fill-gray-400/90 font-sans font-bold text-[10px] tracking-wider pointer-events-none select-none">CAPÓ</text>

      {/* ──────────────── CLICABLES: FARO DELANTERO IZQUIERDO (Aspecto LED rasgado y agresivo) ──────────────── */}
      <path 
        d="M 52 195 C 60 185, 78 185, 122 190 L 118 218 L 56 218 Z"
        {...(zoneProps('faro-del-izq') as React.SVGProps<SVGPathElement>)}
      />
      <circle cx="70" cy="202" r="4.5" className="fill-white/95 pointer-events-none shadow-glow animate-pulse" />
      <text x="90" y="210" textAnchor="middle" className="fill-gray-400 font-sans font-semibold text-[8px] pointer-events-none select-none">F. IZQ</text>

      {/* ──────────────── CLICABLES: FARO DELANTERO DERECHO (Simetría exacta) ──────────────── */}
      <path 
        d="M 348 195 C 340 185, 322 185, 278 190 L 282 218 L 344 218 Z"
        {...(zoneProps('faro-del-der') as React.SVGProps<SVGPathElement>)}
      />
      <circle cx="330" cy="202" r="4.5" className="fill-white/95 pointer-events-none shadow-glow animate-pulse" />
      <text x="310" y="210" textAnchor="middle" className="fill-gray-400 font-sans font-semibold text-[8px] pointer-events-none select-none">F. DER</text>

      {/* ──────────────── CLICABLES: REJILLA / PARRILLA (Moderno diseño hexagonal/grille) ──────────────── */}
      <path 
        d="M 122 190 L 278 190 L 266 225 L 134 225 Z"
        {...(zoneProps('grille') as React.SVGProps<SVGPathElement>)}
      />
      <text x="200" y="212" textAnchor="middle" className="fill-gray-400 font-sans font-bold text-[8px] tracking-wider pointer-events-none select-none">GRILLE</text>

      {/* ──────────────── CLICABLES: ESPEJOS (Zonas clicables de los espejos de frente) ──────────────── */}
      <path 
        d="M 38 112 Q 22 112 28 128 Q 42 128 46 130 Z"
        {...(zoneProps('espejo-izq') as React.SVGProps<SVGPathElement>)}
      />
      <path 
        d="M 362 112 Q 378 112 372 128 Q 358 128 354 130 Z"
        {...(zoneProps('espejo-der') as React.SVGProps<SVGPathElement>)}
      />

      {/* ──────────────── CLICABLES: PARACHOQUE DELANTERO ──────────────── */}
      <path 
        d="M 50 215 L 50 248 C 50 268, 65 284, 98 284 L 302 284 C 335 284, 350 268, 350 248 L 350 215 L 322 217 L 278 220 L 266 225 L 134 225 L 122 220 L 78 217 Z"
        {...(zoneProps('bumper-del') as React.SVGProps<SVGPathElement>)}
      />
      <text x="200" y="260" textAnchor="middle" className="fill-gray-300 font-sans font-bold text-[10px] tracking-wider pointer-events-none select-none">PARACHOQUE DELANTERO</text>

      {/* ─── DETALLES VECTORIALES DE ALTA FIDELIDAD (Capa de Realismo Frontal - pointer-events-none) ─── */}
      <g className="pointer-events-none fill-none stroke-surface-700/60" strokeWidth="1">
        {/* Malla Honeycomb de rejilla central */}
        <path d="M 132 195 L 268 195 M 135 203 L 265 203 M 138 211 L 262 211 M 141 219 L 259 219" className="stroke-surface-700/50" />
        
        {/* Logotipo deportivo central en cromo */}
        <circle cx="200" cy="204" r="5" className="fill-brand-500/20 stroke-brand-400" strokeWidth="1.5" />
        <path d="M 197 204 H 203 M 200 201 V 207" className="stroke-brand-400" strokeWidth="1" />
        
        {/* Reflejos en el parabrisas */}
        <path d="M 125 78 L 165 110 M 155 74 L 205 112" className="stroke-surface-500/15" strokeWidth="1.5" />
        
        {/* Volante visible al interior */}
        <circle cx="135" cy="94" r="8" className="stroke-surface-750/30" />
        <line x1="135" y1="94" x2="135" y2="102" className="stroke-surface-750/30" />
        
        {/* Lentes de proyectores LED triples */}
        <circle cx="68" cy="202" r="2" className="fill-brand-400/20 stroke-brand-400/80" />
        <circle cx="78" cy="204" r="2" className="fill-brand-400/20 stroke-brand-400/80" />
        <circle cx="332" cy="202" r="2" className="fill-brand-400/20 stroke-brand-400/80" />
        <circle cx="322" cy="204" r="2" className="fill-brand-400/20 stroke-brand-400/80" />
        
        {/* Labrado de neumáticos delanteros */}
        <path d="M 58 245 L 82 245 M 58 255 L 82 255 M 58 265 L 82 265 M 318 245 L 342 245 M 318 255 L 342 255 M 318 265 L 342 265" className="stroke-surface-800" />
        
        {/* Líneas de carácter en el capó */}
        <path d="M 140 125 C 150 145, 160 175, 160 195 M 260 125 C 250 145, 240 175, 240 195" className="stroke-surface-700/50" />
        
        {/* Tomas de aire inferiores y luces de niebla (foglights) */}
        <rect x="65" y="240" width="22" height="10" rx="1.5" className="stroke-surface-850 fill-surface-950/40" />
        <rect x="313" y="240" width="22" height="10" rx="1.5" className="stroke-surface-850 fill-surface-950/40" />
        <circle cx="76" cy="245" r="2.5" className="fill-gray-500/80" />
        <circle cx="324" cy="245" r="2.5" className="fill-gray-500/80" />
      </g>

      {/* 🔴 BADGES DINÁMICOS CON CONTEO DE DAÑOS 🔴 */}
      <SVGZoneBadge cx={200} cy={145} count={getCount('capo')} />
      <SVGZoneBadge cx={96} cy={210} count={getCount('faro-del-izq')} />
      <SVGZoneBadge cx={304} cy={210} count={getCount('faro-del-der')} />
      <SVGZoneBadge cx={200} cy={206} count={getCount('grille')} />
      <SVGZoneBadge cx={28} cy={120} count={getCount('espejo-izq')} />
      <SVGZoneBadge cx={372} cy={120} count={getCount('espejo-der')} />
      <SVGZoneBadge cx={200} cy={250} count={getCount('bumper-del')} />
    </svg>
  );
}

// ─── REAR VIEW (Silueta Premium de la Parte Trasera) ───
function RearViewSVG({ zoneProps, getCount, activeZone }: ViewSVGProps) {
  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-[300px] drop-shadow-2xl" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <linearGradient id="taillight-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>

      {/* Ruedas visibles abajo (Anchas traseras con labrado imponente) */}
      <rect x="58" y="235" width="28" height="50" rx="5" className="fill-surface-950 stroke-surface-850" />
      <rect x="314" y="235" width="28" height="50" rx="5" className="fill-surface-950 stroke-surface-850" />

      {/* Silueta exterior total trasera - postura ancha deportiva (tumblehome) */}
      <path 
        d="M 50 255 L 50 140 C 50 140, 52 85, 110 68 C 130 63, 270 63, 290 68 C 348 85, 350 140, 350 255 Z"
        className="fill-surface-950 stroke-surface-800"
        strokeWidth="2.5"
      />

      {/* Luna trasera (Con curvas elegantes y vidriado premium) */}
      <path d="M 98 120 C 120 112, 280 112, 302 120 L 284 72 C 260 67, 140 67, 116 72 Z" fill="url(#glass-grad)" className="stroke-surface-850" />

      {/* ──────────────── CLICABLES: MALETERO ──────────────── */}
      <path 
        d="M 98 122 C 120 115, 280 115, 302 122 C 316 135, 324 165, 326 195 C 290 202, 230 208, 200 208 C 170 208, 110 202, 74 195 C 76 165, 84 135, 98 122 Z"
        {...(zoneProps('maletero') as React.SVGProps<SVGPathElement>)}
      />
      <text x="200" y="160" textAnchor="middle" className="fill-gray-400/90 font-sans font-bold text-[10px] tracking-wider pointer-events-none select-none">MALETERO</text>

      {/* ──────────────── CLICABLES: FARO TRASERO IZQUIERDO (Sleek lightbar design) ──────────────── */}
      <path 
        d="M 52 195 C 60 185, 84 185, 126 190 L 120 215 L 56 215 Z"
        {...(zoneProps('faro-tra-izq') as React.SVGProps<SVGPathElement>)}
      />
      <text x="88" y="206" textAnchor="middle" className="fill-gray-400 font-sans font-semibold text-[8px] pointer-events-none select-none">F.T. IZQ</text>

      {/* ──────────────── CLICABLES: FARO TRASERO DERECHO (Sleek lightbar design) ──────────────── */}
      <path 
        d="M 348 195 C 340 185, 316 185, 274 190 L 280 215 L 344 215 Z"
        {...(zoneProps('faro-tra-der') as React.SVGProps<SVGPathElement>)}
      />
      <text x="312" y="206" textAnchor="middle" className="fill-gray-400 font-sans font-semibold text-[8px] pointer-events-none select-none">F.T. DER</text>

      {/* ──────────────── CLICABLES: PARACHOQUE TRASERO ──────────────── */}
      <path 
        d="M 50 215 L 50 248 C 50 268, 65 284, 98 284 L 302 284 C 335 284, 350 268, 350 248 L 350 215 L 316 215 L 280 215 L 200 208 L 120 215 L 84 215 Z"
        {...(zoneProps('bumper-tra') as React.SVGProps<SVGPathElement>)}
      />
      <text x="200" y="260" textAnchor="middle" className="fill-gray-300 font-sans font-bold text-[10px] tracking-wider pointer-events-none select-none">PARACHOQUE TRASERO</text>

      {/* ─── DETALLES VECTORIALES DE ALTA FIDELIDAD (Capa de Realismo Trasero - pointer-events-none) ─── */}
      <g className="pointer-events-none fill-none stroke-surface-700/60" strokeWidth="1">
        {/* Filamentos térmicos desempañantes en cobre */}
        <line x1="108" y1="82" x2="292" y2="82" className="stroke-orange-500/20" />
        <line x1="104" y1="92" x2="296" y2="92" className="stroke-orange-500/20" />
        <line x1="100" y1="102" x2="300" y2="102" className="stroke-orange-500/20" />
        <line x1="98" y1="112" x2="302" y2="112" className="stroke-orange-500/20" />
        
        {/* Colas de escape deportivas ovaladas en cromo */}
        <rect x="70" y="272" width="20" height="10" rx="3.5" className="fill-surface-850 stroke-surface-700" />
        <rect x="310" y="272" width="20" height="10" rx="3.5" className="fill-surface-850 stroke-surface-700" />
        <circle cx="80" cy="277" r="3" className="fill-surface-950 stroke-surface-650" />
        <circle cx="320" cy="277" r="3" className="fill-surface-950 stroke-surface-650" />
        
        {/* Aletas difusoras del bumper inferior */}
        <line x1="170" y1="274" x2="170" y2="284" className="stroke-surface-800" strokeWidth="2.2" />
        <line x1="200" y1="274" x2="200" y2="284" className="stroke-surface-800" strokeWidth="2.2" />
        <line x1="230" y1="274" x2="230" y2="284" className="stroke-surface-800" strokeWidth="2.2" />
        
        {/* Emblemas cromados de marca y motorización */}
        <text x="110" y="152" className="fill-surface-750 font-sans font-bold text-[7px] tracking-widest uppercase">AWD</text>
        <text x="272" y="152" className="fill-surface-750 font-sans font-bold text-[7px] tracking-widest uppercase">TURBO</text>
        
        {/* Logotipo deportivo central en cromo */}
        <circle cx="200" cy="145" r="5.5" className="fill-brand-500/10 stroke-brand-500/40" strokeWidth="1.5" />
        
        {/* Porta placa de matrícula con iluminación LED */}
        <rect x="165" y="222" width="70" height="24" rx="2" className="fill-yellow-400/90 stroke-yellow-600/40" strokeWidth="1" />
        <text x="200" y="238" textAnchor="middle" className="fill-black font-sans font-black text-[9px] select-none">ABC-123</text>
        <rect x="185" y="220" width="30" height="2" className="fill-brand-500/20 stroke-brand-500/50" />

        {/* Labrado de neumáticos traseros */}
        <path d="M 58 245 L 82 245 M 58 255 L 82 255 M 58 265 L 82 265 M 318 245 L 342 245 M 318 255 L 342 255 M 318 265 L 342 265" className="stroke-surface-800" />
      </g>

      {/* 🔴 BADGES DINÁMICOS CON CONTEO DE DAÑOS 🔴 */}
      <SVGZoneBadge cx={200} cy={140} count={getCount('maletero')} />
      <SVGZoneBadge cx={96} cy={202} count={getCount('faro-tra-izq')} />
      <SVGZoneBadge cx={304} cy={202} count={getCount('faro-tra-der')} />
      <SVGZoneBadge cx={200} cy={256} count={getCount('bumper-tra')} />
    </svg>
  );
}
