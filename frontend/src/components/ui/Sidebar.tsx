import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardList, Users, LogOut, Wrench } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/cotizaciones', icon: FileText, label: 'Proformas' },
  { to: '/app/ordenes', icon: ClipboardList, label: 'Órdenes' },
  { to: '/app/usuarios', icon: Users, label: 'Usuarios', adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-16 lg:w-56 bg-surface-900 border-r border-surface-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench size={16} className="text-white" />
          </div>
          <div className="hidden lg:block overflow-hidden">
            <p className="font-black text-sm leading-tight">
              <span className="text-white">AUTO</span>
              <span className="text-brand-500">BODY</span>
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 flex flex-col gap-1">
        {NAV_ITEMS.filter(item => !item.adminOnly || user?.role === 'ADMIN').map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-3 rounded-lg transition-all min-h-[44px]',
              isActive
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                : 'text-gray-400 hover:text-white hover:bg-surface-800'
            )}
          >
            <item.icon size={18} className="flex-shrink-0" />
            <span className="hidden lg:block text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-surface-800">
        <div className="px-3 py-2 hidden lg:block">
          <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
          <p className="text-[10px] text-gray-500">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all min-h-[44px]"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span className="hidden lg:block text-sm">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
