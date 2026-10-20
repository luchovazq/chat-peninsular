import { randomBytes } from 'node:crypto';

/**
 * Genera un token opaco y seguro (hex). Se usa para magic links, invitaciones
 * y sesiones. Todos viven en la base de datos con `usedAt`/`expiresAt`, lo que
 * permite invalidarlos (single-use) y revocar sesiones en logout.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
