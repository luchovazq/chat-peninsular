'use client';

import { useState } from 'react';
import AuthShell from '@/components/AuthShell';
import { api } from '@/lib/api';
import type { MagicLinkResponse } from '@chat-peninsular/types';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none';
const buttonClass =
  'w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await api<MagicLinkResponse>('/api/v1/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    setLoading(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setMessage(res.data.message);
  }

  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Te enviaremos un enlace mágico a tu correo. Sin contraseñas."
    >
      {message ? (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@caribepeninsular.mx"
              className={inputClass}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
