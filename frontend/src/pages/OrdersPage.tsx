import React from 'react';
import OrderList from '@/components/admin/OrderList';

export default function OrdersPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Órdenes de Trabajo</h1>
        <p className="text-gray-500 text-sm mt-1">Gestión y seguimiento de reparaciones activas</p>
      </div>
      <OrderList />
    </div>
  );
}
