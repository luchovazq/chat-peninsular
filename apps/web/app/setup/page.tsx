'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { api } from '@/lib/api';
import type { SetupStatusResponse, SetupResponse } from '@chat-peninsular/types';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none';
const buttonClass =
  'w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50';

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<SetupStatusResponse>('/api/v1/setup').then((res) => {
      if (res.error) return;
      if (!res.data.needsSetup) {
        router.replace('/login');
        return;
      }
      setChecking(false);
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await api<SetupResponse>('/api/v1/setup', {
      method: 'POST',
      body: JSON.stringify({ email, name })
    });

    setLoading(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setDone(true);
  }

  if (checking) {
    return <p className="p-8 text-center text-slate-500">Cargando…</p>;
  }

  return (
    <AuthShell
      title="Configuración inicial"
      subtitle="Crea la cuenta de administrador"
    >
      {done ? (
        <div className="space-y-3">
          <p className="text-sm text-emerald-700">Setup completado.</p>
          <a
            href="/login"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Ir a iniciar sesión
          </a>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email del administrador
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@caribepeninsular.mx"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Luis Vázquez"
              className={inputClass}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? 'Creando…' : 'Crear administrador'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
