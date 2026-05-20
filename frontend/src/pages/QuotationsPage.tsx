import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Printer, CheckCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import QuotationForm from '@/components/quotation/QuotationForm';
import PrintQuotation from '@/components/quotation/PrintQuotation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

export default function QuotationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [printQuotation, setPrintQuotation] = useState<any>(null);

  const { data, refetch } = useQuery({
    queryKey: ['quotations', page],
    queryFn: () => api.get('/quotations', { params: { page, limit: 20 } }).then(r => r.data),
    enabled: !showForm,
  });

  const quotations = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  const handlePrint = async (quotationId: string) => {
    try {
      const toastId = toast.loading('Cargando proforma para impresión...');
      const { data: res } = await api.get(`/quotations/${quotationId}`);
      if (res.success && res.data) {
        setPrintQuotation(res.data);
        toast.dismiss(toastId);
        
        // Allow DOM to update before triggering print
        setTimeout(() => {
          window.print();
        }, 150);
      } else {
        toast.error('No se pudo cargar la proforma', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al preparar impresión');
    }
  };

  if (showForm) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setShowForm(false)} className="btn-secondary gap-2">
            ← Volver
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Nueva Proforma</h1>
            <p className="text-gray-500 text-sm">Selecciona zonas y configura los precios</p>
          </div>
        </div>
        <QuotationForm onSuccess={(newQ: any) => { 
          setShowForm(false); 
          refetch(); 
          if (newQ && newQ.id) {
            handlePrint(newQ.id);
          }
        }} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Proformas</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.data?.total ?? 0} proformas en total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2">
          <Plus size={16} />
          Nueva Proforma
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">N° Proforma</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Cliente</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Vehículo</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Aseguradora</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Total</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Estado</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-semibold">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No hay proformas. <button onClick={() => setShowForm(true)} className="text-brand-400 hover:underline">Crear la primera</button>
                  </td>
                </tr>
              )}
              {quotations.map((q: {
                id: string; numero: string; aprobada: boolean;
                total: number; aseguradora: string; createdAt: string;
                cliente: { nombre: string }; vehiculo: { placa: string; marca: string; modelo: string };
              }) => (
                <tr key={q.id} className="table-row">
                  <td className="px-4 py-3">
                    <span className="font-mono text-brand-400 font-semibold">{q.numero}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-200">{q.cliente.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono">{q.vehiculo.placa}</span>
                    <span className="text-gray-500 text-xs ml-2">{q.vehiculo.marca} {q.vehiculo.modelo}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{q.aseguradora}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                    S/. {Number(q.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'badge border',
                      q.aprobada
                        ? 'text-green-400 bg-green-500/10 border-green-500/30'
                        : 'text-gray-400 bg-surface-800 border-surface-600'
                    )}>
                      {q.aprobada ? <><CheckCircle size={11} /> Aprobada</> : <><Clock size={11} /> Pendiente</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(q.createdAt), 'dd/MM/yy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handlePrint(q.id)}
                      className="btn-ghost p-2 rounded-lg text-brand-400 hover:text-brand-300 hover:bg-surface-800"
                      title="Imprimir Proforma"
                    >
                      <Printer size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-surface-700">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-2 text-sm disabled:opacity-40">← Anterior</button>
            <span className="flex items-center px-4 text-sm text-gray-400">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-2 text-sm disabled:opacity-40">Siguiente →</button>
          </div>
        )}
      </div>

      {/* Hidden Print Container */}
      <PrintQuotation quotation={printQuotation} />
    </div>
  );
}

