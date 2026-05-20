// Shared types between frontend and backend

export type UserRole = 'ADMIN' | 'RECEPCIONISTA' | 'TECNICO';

export type InterventionType =
  | 'REEMPLAZO'
  | 'PLANCHADO'
  | 'MASILLA_Y_PINTURA'
  | 'PINTURA_SOLAMENTE'
  | 'REPARACION'
  | 'REVISION_DIAGNOSTICO'
  | 'LIMPIEZA_DETAILING';

export type OrderStatus =
  | 'RECIBIDO'
  | 'EN_EVALUACION'
  | 'ESPERANDO_REPUESTOS'
  | 'EN_PLANCHADO'
  | 'EN_PINTURA'
  | 'EN_CONTROL_CALIDAD'
  | 'LISTO'
  | 'ENTREGADO';

export type TrackingStage = 'RECEPCION' | 'EN_REPARACION' | 'LISTO_ENTREGA' | 'COMPLETADO';

export const ORDER_STATUS_TO_STAGE: Record<OrderStatus, TrackingStage> = {
  RECIBIDO: 'RECEPCION',
  EN_EVALUACION: 'RECEPCION',
  ESPERANDO_REPUESTOS: 'EN_REPARACION',
  EN_PLANCHADO: 'EN_REPARACION',
  EN_PINTURA: 'EN_REPARACION',
  EN_CONTROL_CALIDAD: 'EN_REPARACION',
  LISTO: 'LISTO_ENTREGA',
  ENTREGADO: 'COMPLETADO',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECIBIDO: 'Recibido',
  EN_EVALUACION: 'En Evaluación',
  ESPERANDO_REPUESTOS: 'Esperando Repuestos',
  EN_PLANCHADO: 'En Planchado',
  EN_PINTURA: 'En Pintura',
  EN_CONTROL_CALIDAD: 'En Control de Calidad',
  LISTO: 'Listo para Entrega',
  ENTREGADO: 'Entregado',
};

export const INTERVENTION_LABELS: Record<InterventionType, string> = {
  REEMPLAZO: 'Reemplazo (Pieza Nueva)',
  PLANCHADO: 'Planchado',
  MASILLA_Y_PINTURA: 'Masilla y Pintura',
  PINTURA_SOLAMENTE: 'Pintura Solamente',
  REPARACION: 'Reparación',
  REVISION_DIAGNOSTICO: 'Revisión / Diagnóstico',
  LIMPIEZA_DETAILING: 'Limpieza / Detailing',
};

export const ASEGURADORAS = [
  'Particular',
  'Rímac Seguros',
  'Pacífico Seguros',
  'MAPFRE',
  'La Positiva',
  'Interseguro',
  'HDI Seguros',
  'Ohio National',
  'Secrex',
  'SOAT',
] as const;

export type Aseguradora = (typeof ASEGURADORAS)[number];

// Vehicle zone config types
export interface Subcomponent {
  id: string;
  label: string;
}

export interface VehicleZone {
  id: string;
  label: string;
  view: 'top' | 'front' | 'rear' | 'left' | 'right';
  subcomponents: Subcomponent[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

// Customer types
export interface CreateCustomerDto {
  nombre: string;
  dni_ruc?: string;
  telefono: string;
  email?: string;
}

// Vehicle types
export interface CreateVehicleDto {
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  color?: string;
  kilometraje?: number;
}

// Quotation types
export interface QuotationItemDto {
  zonaId: string;
  zonaLabel: string;
  subcomponenteId: string;
  subcomponenteLabel: string;
  tipoIntervencion: InterventionType;
  descripcion?: string;
  costoManoObra: number;
  costoMateriales: number;
}

export interface CreateQuotationDto {
  clienteId?: string;
  cliente?: CreateCustomerDto;
  vehiculoId?: string;
  vehiculo?: CreateVehicleDto;
  aseguradora: string;
  numeroSiniestro?: string;
  items: QuotationItemDto[];
  tiempoEstimadoDias: number;
  notas?: string;
  validezDias: number;
}

// Order types
export interface CreateOrderDto {
  cotizacionId: string;
  tecnicoId?: string;
  notas?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  mensaje?: string;
}
