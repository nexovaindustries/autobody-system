import React from 'react';
import Dashboard from '@/components/admin/Dashboard';

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen operativo del taller</p>
      </div>
      <Dashboard />
    </div>
  );
}
