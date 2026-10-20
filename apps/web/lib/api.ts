import type { ApiResponse } from '@chat-peninsular/types';

/**
 * Cliente fetch mínimo. Habla con el backend en same-origin (el proxy de
 * Next.js en desarrollo y nginx en producción reenvían /api al servidor).
 */
export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  return (await res.json()) as ApiResponse<T>;
}
