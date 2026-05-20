import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Wrench, Eye, EyeOff, Key, Check, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Supabase Key settings
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isKeyConfigured, setIsKeyConfigured] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('SUPABASE_ANON_KEY') || '';
    setSupabaseKey(key);
    // Check if key is configured (either in localStorage or injected via Vite env)
    const hasEnvKey = !!(import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    setIsKeyConfigured(!!key || hasEnvKey);
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseKey.trim()) {
      toast.error('Por favor, ingresa una clave válida');
      return;
    }
    localStorage.setItem('SUPABASE_ANON_KEY', supabaseKey.trim());
    toast.success('Clave de Supabase guardada. Reiniciando...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/login', { email, password }).then(r => r.data),
    onSuccess: (data) => {
      const { user, token, refreshToken } = data.data;
      login(user, token, refreshToken);
      toast.success(`Bienvenido, ${user.name}`);
      navigate('/app/dashboard');
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.error || 'Credenciales incorrectas';
      toast.error(errMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKeyConfigured) {
      toast.error('Debes configurar la clave de Supabase primero');
      setShowConfig(true);
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 flex-col gap-6">
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

        {/* Warning if Supabase Key is missing */}
        {!isKeyConfigured && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 text-amber-400 text-xs flex gap-3 items-start">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-bold mb-1">Clave de Supabase requerida</p>
              <p className="mb-2 leading-relaxed">
                El sistema necesita la clave pública anon para comunicarse con la base de datos centralizada en Supabase.
              </p>
              <button
                onClick={() => setShowConfig(true)}
                className="text-amber-300 font-bold hover:underline flex items-center gap-1"
              >
                Configurar ahora →
              </button>
            </div>
          </div>
        )}

        {/* Supabase Key Config Collapsible */}
        {showConfig && (
          <div className="card p-5 mb-4 border border-brand-500/30 bg-surface-900 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key size={16} className="text-brand-400" />
              Configurar Supabase Anon Key
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Ingresa la <strong>anon/public API key</strong> de tu proyecto Supabase (disponible en Settings &gt; API en tu panel de Supabase).
            </p>
            <form onSubmit={handleSaveKey} className="flex gap-2 mt-1">
              <input
                type="text"
                className="input text-xs font-mono py-1.5"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary py-1.5 px-3 flex items-center justify-center shrink-0">
                <Check size={16} />
              </button>
            </form>
          </div>
        )}

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
              disabled={!isKeyConfigured}
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
                disabled={!isKeyConfigured}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                disabled={!isKeyConfigured}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !isKeyConfigured}
            className="btn-primary w-full mt-2"
          >
            {mutation.isPending ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div className="text-center mt-6 flex flex-col gap-2">
          <button
            onClick={() => setShowConfig(c => !c)}
            className="text-xs text-gray-500 hover:text-brand-400 transition"
          >
            {showConfig ? 'Ocultar ajustes de conexión' : 'Ajustes de conexión (Supabase)'}
          </button>
          <p className="text-xs text-gray-600">
            Av. Aviación Km. 6 Interior, Cerro Colorado, Arequipa
          </p>
        </div>
      </div>
    </div>
  );
}

