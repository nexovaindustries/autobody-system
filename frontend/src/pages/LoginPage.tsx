import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Wrench, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/login', { email, password }).then(r => r.data),
    onSuccess: (data) => {
      const { user, token, refreshToken } = data.data;
      login(user, token, refreshToken);
      toast.success(`Bienvenido, ${user.name}`);
      navigate('/app/dashboard');
    },
    onError: () => toast.error('Credenciales incorrectas'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black">
            <span className="text-white">AUTO</span>
            <span className="text-brand-500">BODY</span>
            <span className="text-white"> SAC</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Gestión Interno</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4">
          <div>
            <label className="label">Correo electrónico</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@autobody.pe"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <input
                className="input pr-12"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary w-full mt-2"
          >
            {mutation.isPending ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-4">
          Av. Aviación Km. 6 Interior, Cerro Colorado, Arequipa
        </p>
      </div>
    </div>
  );
}
