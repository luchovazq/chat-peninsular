'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { MeResponse, UserDTO } from '@chat-peninsular/types';

export default function AppHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserDTO | null>(null);

  useEffect(() => {
    api<MeResponse>('/api/v1/auth/me').then((res) => {
      if (res.error) {
        router.replace('/login');
        return;
      }
      setUser(res.data.user);
    });
  }, [router]);

  async function logout() {
    await api('/api/v1/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  if (!user) {
    return <p className="p-8 text-center text-slate-500">Cargando…</p>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="text-sm font-semibold">Chat Peninsular</div>
        <div className="flex items-center gap-3">
          {user.role === 'ADMIN' ? (
            <a href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
              Admin
            </a>
          ) : null}
          <span className="text-sm text-slate-600">{user.name}</span>
          <button onClick={logout} className="text-sm text-slate-600 hover:text-slate-900">
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold">¡Hola, {user.name}!</h1>
          <p className="mt-1 text-sm text-slate-500">
            El workspace estará listo en el hito 2 (canales y mensajes).
          </p>
        </div>
      </main>
    </div>
  );
}
