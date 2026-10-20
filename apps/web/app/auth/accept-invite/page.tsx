'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { api } from '@/lib/api';
import type { AcceptInviteInfo, AcceptInviteResponse } from '@chat-peninsular/types';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none';
const buttonClass =
  'w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50';

function AcceptInviteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [phase, setPhase] = useState<'loading' | 'form' | 'error'>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
        setError('La invitación es inválida.');
        setPhase('error');
        return;
      }

      const res = await api<AcceptInviteInfo>(
        `/api/v1/auth/accept-invite?token=${encodeURIComponent(token)}`
      );

      if (cancelled) return;
      if (res.error) {
        setError(res.error.message);
        setPhase('error');
        return;
      }
      if (!res.data.valid) {
        setError('La invitación es inválida o ha expirado.');
        setPhase('error');
        return;
      }

      setEmail(res.data.email);
      setPhase('form');
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await api<AcceptInviteResponse>('/api/v1/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, name })
    });

    if (res.error) {
      setError(res.error.message);
      setSubmitting(false);
      return;
    }
    router.replace(res.data.redirect);
  }

  return (
    <AuthShell
      title="Activa tu cuenta"
      subtitle={email ? `Te unirás como ${email}` : 'Bienvenido'}
    >
      {phase === 'loading' ? (
        <p className="text-sm text-slate-600">Validando invitación…</p>
      ) : phase === 'error' ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Tu nombre
            </label>
            <input
              id="name"
              type="text"
              required
              autoFocus
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="María López"
              className={inputClass}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-slate-500">Cargando…</p>}>
      <AcceptInviteInner />
    </Suspense>
  );
}
