import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './pages/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import QuotationsPage from './pages/QuotationsPage';
import OrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import TrackingPortal from './components/tracking/TrackingPortal';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/seguimiento" element={<TrackingPortal />} />

      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="cotizaciones" element={<QuotationsPage />} />
        <Route path="ordenes" element={<OrdersPage />} />
        <Route path="usuarios" element={<UsersPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
}
