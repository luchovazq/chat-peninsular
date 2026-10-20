'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { api } from '@/lib/api';
import type { VerifyResponse } from '@chat-peninsular/types';

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setError('El enlace es inválido.');
        return;
      }

      const res = await api<VerifyResponse>('/api/v1/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token })
      });

      if (cancelled) return;
      if (res.error) {
        setError(res.error.message);
        return;
      }

      setDone(true);
      router.replace(res.data.redirect);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <AuthShell title="Verificando enlace" subtitle="Un momento…">
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : done ? (
        <p className="text-sm text-slate-600">Sesión iniciada. Redirigiendo…</p>
      ) : (
        <p className="text-sm text-slate-600">Validando tu enlace…</p>
      )}
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-slate-500">Cargando…</p>}>
      <VerifyInner />
    </Suspense>
  );
}
