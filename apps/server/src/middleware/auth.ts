import type { NextFunction, Request, Response } from 'express';
import type { User } from '@prisma/client';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';
import { fail } from '../lib/response';

export interface AuthedRequest extends Request {
  userId?: string;
  user?: User;
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[config.cookieName] as string | undefined;

    if (!token) {
      res.status(401).json(fail({ message: 'No has iniciado sesión.', code: 'UNAUTHORIZED' }));
      return;
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json(fail({ message: 'Tu sesión ha expirado.', code: 'UNAUTHORIZED' }));
      return;
    }

    if (!session.user.isActive) {
      res.status(403).json(fail({ message: 'Tu cuenta está desactivada.', code: 'ACCOUNT_INACTIVE' }));
      return;
    }

    req.userId = session.user.id;
    req.user = session.user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json(fail({ message: 'Se requieren permisos de administrador.', code: 'FORBIDDEN' }));
    return;
  }
  next();
}
