/**
 * Rate limiter en memoria, por clave. Para v1 (un solo proceso Node) es
 * suficiente. Se usa para limitar los magic links por email (3 por hora).
 */
const WINDOW_MS = 60 * 60 * 1000; // 1 hora
const MAX_PER_WINDOW = 3;

const buckets = new Map<string, number[]>();

export function isRateLimited(key: string, max = MAX_PER_WINDOW): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= max) {
    buckets.set(key, recent);
    return true;
  }

  recent.push(now);
  buckets.set(key, recent);
  return false;
}
