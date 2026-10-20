'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type {
  MeResponse,
  UserDTO,
  InvitationDTO,
  ListInvitationsResponse,
  CreateInvitationResponse
} from '@chat-peninsular/types';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none';
const buttonClass =
  'rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [invitations, setInvitations] = useState<InvitationDTO[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refreshInvitations() {
    const res = await api<ListInvitationsResponse>('/api/v1/admin/invitations');
    if (!res.error) {
      setInvitations(res.data.invitations);
    }
  }

  useEffect(() => {
    api<MeResponse>('/api/v1/auth/me').then((res) => {
      if (res.error) {
        router.replace('/login');
        return;
      }
      if (res.data.user.role !== 'ADMIN') {
        router.replace('/app');
        return;
      }
      setUser(res.data.user);
    });
    refreshInvitations();
  }, [router]);

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await api<CreateInvitationResponse>('/api/v1/admin/invitations', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    setLoading(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setMessage(`Invitación enviada a ${res.data.invitation.email}.`);
    setEmail('');
    refreshInvitations();
  }

  if (!user) {
    return <p className="p-8 text-center text-slate-500">Cargando…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <a href="/app" className="text-sm text-slate-600 hover:text-slate-900">
          ← Volver al chat
        </a>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Invitar usuario</h2>
        <form onSubmit={invite} className="mt-4 flex gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nuevo@caribepeninsular.mx"
            className={inputClass}
          />
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? 'Enviando…' : 'Invitar'}
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Invitaciones</h2>
        {invitations.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No hay invitaciones todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{inv.email}</span>
                <span className={inv.usedAt ? 'text-slate-400' : 'text-emerald-600'}>
                  {inv.usedAt ? 'Usada' : 'Pendiente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
