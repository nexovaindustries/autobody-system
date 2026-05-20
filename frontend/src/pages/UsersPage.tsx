import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Shield, UserCheck, Wrench } from 'lucide-react';
import { api } from '@/lib/api';
import { UserRole } from '@autobody/shared';
import clsx from 'clsx';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-red-400 bg-red-500/10 border-red-500/30',
  RECEPCIONISTA: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  TECNICO: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  ADMIN: Shield,
  RECEPCIONISTA: UserCheck,
  TECNICO: Wrench,
};

interface User { id: string; name: string; email: string; role: UserRole; active: boolean; }

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'RECEPCIONISTA' as UserRole });

  const mutation = useMutation({
    mutationFn: () => api.post('/users', form).then(r => r.data),
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear usuario';
      toast.error(msg);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6">
        <h3 className="font-bold text-white mb-4">Nuevo Usuario</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="label">Nombre completo</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Juan García" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="juan@autobody.pe" />
          </div>
          <div>
            <label className="label">Contraseña (mínimo 8 caracteres)</label>
            <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}>
              <option value="RECEPCIONISTA">Recepcionista</option>
              <option value="TECNICO">Técnico</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (user: User) => api.patch(`/users/${user.id}`, { active: !user.active }).then(r => r.data),
    onSuccess: () => {
      toast.success('Usuario actualizado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const users: User[] = data?.data ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuarios del Sistema</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
          <Plus size={16} />
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => {
          const Icon = ROLE_ICONS[user.role] ?? Shield;
          return (
            <div key={user.id} className={clsx('card p-4', !user.active && 'opacity-50')}>
              <div className="flex items-start justify-between mb-3">
                <div className={clsx('badge border', ROLE_COLORS[user.role])}>
                  <Icon size={11} />
                  {user.role}
                </div>
                <button
                  onClick={() => toggleMutation.mutate(user)}
                  className={clsx(
                    'text-xs px-2 py-1 rounded border transition-all',
                    user.active
                      ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                      : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                  )}
                >
                  {user.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
              <p className="font-semibold text-white">{user.name}</p>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          );
        })}
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
