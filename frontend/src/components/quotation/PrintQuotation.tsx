import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { INTERVENTION_LABELS } from '@autobody/shared';

interface PrintQuotationProps {
  quotation: {
    numero: string;
    createdAt: string | Date;
    validezDias: number;
    tiempoEstimadoDias: number;
    aseguradora: string;
    numeroSiniestro?: string;
    subtotal: number;
    igv: number;
    total: number;
    notas?: string;
    cliente: {
      nombre: string;
      dni_ruc?: string;
      telefono: string;
      email?: string;
    };
    vehiculo: {
      placa: string;
      marca: string;
      modelo: string;
      anio?: number;
      color?: string;
      kilometraje?: number;
    };
    items: Array<{
      id: string;
      zonaLabel: string;
      subcomponenteLabel: string;
      tipoIntervencion: string;
      descripcion?: string;
      costoManoObra: number;
      costoMateriales: number;
      subtotal: number;
    }>;
    createdBy?: {
      name: string;
    };
  } | null;
}

export default function PrintQuotation({ quotation }: PrintQuotationProps) {
  if (!quotation) return null;

  const fechaFormateada = format(new Date(quotation.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div className="print-only hidden print:block w-full max-w-[800px] mx-auto p-8 text-black bg-white font-sans">
      {/* Header Corporativo */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-1">
            AUTO<span className="text-red-600">BODY</span>
            <span className="text-sm font-normal text-gray-500 ml-2">SAC</span>
          </h1>
          <p className="text-xs text-gray-600 mt-1 font-semibold">TALLER MULTIMARCA DE PLANCHADO Y PINTURA</p>
          <p className="text-xs text-gray-500 mt-2">Av. Aviación Km. 6 Interior, Cerro Colorado - Arequipa</p>
          <p className="text-xs text-gray-500">Teléfono: +51 987 654 321 | email: contacto@autobody.pe</p>
        </div>
        <div className="text-right border border-gray-400 p-4 rounded-xl bg-gray-50 min-w-[200px]">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">R.U.C. 20609876543</h2>
          <h3 className="text-lg font-black text-gray-950 mt-1">PROFORMA</h3>
          <p className="text-lg font-mono font-bold text-red-600 mt-1">{quotation.numero}</p>
        </div>
      </div>

      {/* Información de Metadatos de Proforma */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-xs border-b border-gray-200 pb-4">
        <div>
          <p><span className="font-bold text-gray-700">Fecha de Emisión:</span> {fechaFormateada}</p>
          <p className="mt-1"><span className="font-bold text-gray-700">Validez de Oferta:</span> {quotation.validezDias} días calendario</p>
        </div>
        <div className="text-right">
          <p><span className="font-bold text-gray-700">Compañía Aseguradora:</span> {quotation.aseguradora}</p>
          {quotation.numeroSiniestro && (
            <p className="mt-1"><span className="font-bold text-gray-700">N° Siniestro / Siniestro:</span> {quotation.numeroSiniestro}</p>
          )}
        </div>
      </div>

      {/* Secciones de Cliente y Vehículo */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
        {/* Cliente */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50/50">
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2 uppercase tracking-wide">DATOS DEL CLIENTE</h4>
          <table className="w-full text-left">
            <tbody>
              <tr>
                <th className="font-semibold text-gray-600 w-20 py-0.5">Nombre:</th>
                <td className="text-gray-900 py-0.5 font-bold">{quotation.cliente.nombre}</td>
              </tr>
              {quotation.cliente.dni_ruc && (
                <tr>
                  <th className="font-semibold text-gray-600 py-0.5">DNI / RUC:</th>
                  <td className="text-gray-900 py-0.5">{quotation.cliente.dni_ruc}</td>
                </tr>
              )}
              <tr>
                <th className="font-semibold text-gray-600 py-0.5">Teléfono:</th>
                <td className="text-gray-900 py-0.5">{quotation.cliente.telefono}</td>
              </tr>
              {quotation.cliente.email && (
                <tr>
                  <th className="font-semibold text-gray-600 py-0.5">Correo:</th>
                  <td className="text-gray-900 py-0.5">{quotation.cliente.email}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vehículo */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50/50">
          <h4 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2 uppercase tracking-wide">DATOS DEL VEHÍCULO</h4>
          <table className="w-full text-left">
            <tbody>
              <tr>
                <th className="font-semibold text-gray-600 w-20 py-0.5">Placa:</th>
                <td className="text-gray-900 py-0.5 font-bold font-mono text-sm">{quotation.vehiculo.placa}</td>
              </tr>
              <tr>
                <th className="font-semibold text-gray-600 py-0.5">Marca / Mod:</th>
                <td className="text-gray-900 py-0.5">{quotation.vehiculo.marca} {quotation.vehiculo.modelo}</td>
              </tr>
              {quotation.vehiculo.anio && (
                <tr>
                  <th className="font-semibold text-gray-600 py-0.5">Año Fab.:</th>
                  <td className="text-gray-900 py-0.5">{quotation.vehiculo.anio}</td>
                </tr>
              )}
              {quotation.vehiculo.color && (
                <tr>
                  <th className="font-semibold text-gray-600 py-0.5">Color:</th>
                  <td className="text-gray-900 py-0.5">{quotation.vehiculo.color}</td>
                </tr>
              )}
              {quotation.vehiculo.kilometraje && (
                <tr>
                  <th className="font-semibold text-gray-600 py-0.5">KM:</th>
                  <td className="text-gray-900 py-0.5 font-mono">{Number(quotation.vehiculo.kilometraje).toLocaleString()} km</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de Intervenciones */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">DESCRIPCIÓN DE TRABAJOS Y REPARACIONES</h4>
        <table className="w-full text-xs border border-gray-300 border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold">
              <th className="px-3 py-2 border-r border-gray-300 text-left">Zona / Parte</th>
              <th className="px-3 py-2 border-r border-gray-300 text-left">Reparación / Intervención</th>
              <th className="px-3 py-2 border-r border-gray-300 text-left">Descripción Adicional</th>
              <th className="px-3 py-2 border-r border-gray-300 text-right w-24">Mano de Obra</th>
              <th className="px-3 py-2 border-r border-gray-300 text-right w-24">Materiales</th>
              <th className="px-3 py-2 text-right w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, idx) => (
              <tr key={item.id || idx} className="border-b border-gray-200">
                <td className="px-3 py-1.5 border-r border-gray-300">
                  <span className="font-bold text-gray-900">{item.zonaLabel}</span>
                  <span className="text-gray-500 text-[10px] block font-semibold">{item.subcomponenteLabel}</span>
                </td>
                <td className="px-3 py-1.5 border-r border-gray-300 font-medium">
                  {(INTERVENTION_LABELS as any)[item.tipoIntervencion] || item.tipoIntervencion}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-300 text-gray-600 leading-relaxed italic">
                  {item.descripcion || 'Sin observaciones'}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-300 text-right font-mono text-gray-700">
                  S/. {Number(item.costoManoObra).toFixed(2)}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-300 text-right font-mono text-gray-700">
                  S/. {Number(item.costoMateriales).toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono font-bold text-gray-950">
                  S/. {Number(item.subtotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales y Notas */}
      <div className="grid grid-cols-12 gap-6 items-start text-xs mb-8">
        {/* Notas y Tiempos */}
        <div className="col-span-7 border border-gray-300 rounded-lg p-3 bg-gray-50">
          <p className="mb-2"><span className="font-bold text-gray-700">Tiempo de Entrega Estimado:</span> {quotation.tiempoEstimadoDias} días hábiles de trabajo efectivos a partir de la firma de conformidad.</p>
          {quotation.notas && (
            <div className="mt-2 border-t border-gray-200 pt-2">
              <span className="font-bold text-gray-700 block mb-1">Notas / Observaciones de Taller:</span>
              <p className="text-gray-600 italic leading-relaxed">{quotation.notas}</p>
            </div>
          )}
        </div>

        {/* Cuentas Totales */}
        <div className="col-span-5 text-right font-sans">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <th className="text-right text-gray-600 font-semibold py-1 pr-3">SUBTOTAL AFECTO:</th>
                <td className="font-mono text-gray-800 py-1 w-28">S/. {Number(quotation.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <th className="text-right text-gray-600 font-semibold py-1 pr-3">I.G.V. (18%):</th>
                <td className="font-mono text-gray-800 py-1 border-b border-gray-300">S/. {Number(quotation.igv).toFixed(2)}</td>
              </tr>
              <tr className="text-sm font-bold text-gray-950">
                <th className="text-right py-2 pr-3 text-red-600 uppercase tracking-wide">TOTAL GENERAL (PEN):</th>
                <td className="font-mono py-2 text-base text-gray-950 font-black">S/. {Number(quotation.total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección de Firmas y Garantía */}
      <div className="mt-12 text-center text-xs">
        <p className="text-[10px] text-gray-400 max-w-[600px] mx-auto leading-relaxed mb-12 border-t border-gray-100 pt-4">
          La presente proforma constituye una oferta económica sujeta a las condiciones y especificaciones indicadas. El inicio de los trabajos está sujeto a la aprobación de la aseguradora y/o la firma de este presupuesto por parte del propietario del vehículo. Toda reparación tiene garantía del taller bajo uso normal.
        </p>
        <div className="flex justify-around items-end gap-12 mt-6">
          <div className="flex flex-col items-center">
            <div className="w-48 border-b border-gray-400 mb-2"></div>
            <p className="font-bold text-gray-700">Firma Autorizada</p>
            <p className="text-[10px] text-gray-500 mt-0.5">AUTO BODY SAC</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-48 border-b border-gray-400 mb-2"></div>
            <p className="font-bold text-gray-700">Aceptación y Conformidad</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Cliente / Propietario</p>
          </div>
        </div>
      </div>
    </div>
  );
}
