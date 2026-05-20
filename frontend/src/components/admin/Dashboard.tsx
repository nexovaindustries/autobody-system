import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { ORDER_STATUS_LABELS, OrderStatus } from '@autobody/shared';
import { TrendingUp, Clock, Package, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  RECIBIDO: '#60a5fa',
  EN_EVALUACION: '#a78bfa',
  ESPERANDO_REPUESTOS: '#fbbf24',
  EN_PLANCHADO: '#f97316',
  EN_PINTURA: '#fb923c',
  EN_CONTROL_CALIDAD: '#34d399',
  LISTO: '#4ade80',
  ENTREGADO: '#6b7280',
};

interface DashboardStats {
  activeToday: number;
  activeWeek: number;
  byStatus: Array<{ status: string; count: number }>;
  monthlyRevenue: number;
  byAseguradora: Array<{ aseguradora: string; count: number }>;
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="p-2 bg-brand-500/10 rounded-lg">
          <Icon size={20} className="text-brand-400" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<{ success: boolean; data: DashboardStats }>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/orders/stats/dashboard').then(r => r.data),
    refetchInterval: 30_000,
  });

  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-28 animate-pulse bg-surface-800" />
        ))}
      </div>
    );
  }

  const chartData = stats?.byStatus.map(s => ({
    name: ORDER_STATUS_LABELS[s.status as OrderStatus] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? '#6b7280',
  })) ?? [];

  const totalOrders = stats?.byStatus.reduce((acc, s) => acc + s.count, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Activos Hoy" value={stats?.activeToday ?? 0} icon={Clock} />
        <StatCard label="Esta Semana" value={stats?.activeWeek ?? 0} icon={Package} />
        <StatCard label="Total Órdenes" value={totalOrders} icon={CheckCircle} />
        <StatCard
          label="Ingresos del Mes"
          value={`S/. ${(stats?.monthlyRevenue ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 0 })}`}
          icon={TrendingUp}
          sub="cotizaciones aprobadas"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Órdenes por Estado</h3>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Sin datos aún</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e1e1e', border: '1px solid #2d2d2d', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-gray-400 flex-1 truncate">{d.name}</span>
                    <span className="text-white font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* By Aseguradora */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Top Aseguradoras</h3>
          <div className="flex flex-col gap-2">
            {(stats?.byAseguradora ?? []).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Sin datos aún</p>
            ) : (
              stats?.byAseguradora.map((a, i) => {
                const max = stats.byAseguradora[0].count;
                const pct = Math.round((a.count / max) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-28 truncate flex-shrink-0">{a.aseguradora}</span>
                    <div className="flex-1 bg-surface-800 rounded-full h-2">
                      <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-white font-semibold w-6 text-right">{a.count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
