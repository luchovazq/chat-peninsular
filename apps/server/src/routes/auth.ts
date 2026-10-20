import { Router } from 'express';
import type { Response } from 'express';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';
import { generateToken } from '../lib/tokens';
import { sendMagicLinkEmail } from '../lib/email';
import { ok, fail } from '../lib/response';
import { isRateLimited } from '../lib/rate-limit';
import { asyncHandler } from '../middleware/error';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { toUserDTO } from '../lib/dto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.isProduction,
  path: '/',
  maxAge: config.sessionTtlDays * 24 * 60 * 60 * 1000
};

function setSessionCookie(res: Response, token: string): void {
  res.cookie(config.cookieName, token, COOKIE_OPTIONS);
}

async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000)
    }
  });
  return token;
}

export const authRouter = Router();

// POST /api/v1/auth/magic-link
authRouter.post(
  '/magic-link',
  asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!EMAIL_RE.test(email)) {
      res.status(400).json(fail({ message: 'Ingresa un email válido.', code: 'INVALID_EMAIL' }));
      return;
    }

    if (isRateLimited(`magic-link:${email}`)) {
      res.status(429).json(
        fail({ message: 'Demasiadas solicitudes. Intenta de nuevo en una hora.', code: 'RATE_LIMITED' })
      );
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.isActive) {
      const token = generateToken();
      await prisma.magicLink.create({
        data: {
          email,
          token,
          expiresAt: new Date(Date.now() + config.magicLinkTtlMinutes * 60 * 1000)
        }
      });
      await sendMagicLinkEmail(email, `${config.appUrl}/auth/verify?token=${token}`);
    }

    // Respuesta idéntica exista o no el email: previene enumeración de usuarios.
    res.status(200).json(ok({ message: 'Si el email existe, recibirás un enlace en breve.' }));
  })
);

// POST /api/v1/auth/verify
authRouter.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';

    if (!token) {
      res.status(400).json(fail({ message: 'El enlace es inválido.', code: 'INVALID_TOKEN' }));
      return;
    }

    // updateMany hace el single-use atómico: solo marca si sigue sin usarse y no expiró.
    const claimed = await prisma.magicLink.updateMany({
      where: { token, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() }
    });

    if (claimed.count === 0) {
      res.status(400).json(fail({ message: 'El enlace es inválido o ha expirado.', code: 'INVALID_TOKEN' }));
      return;
    }

    const magicLink = await prisma.magicLink.findUnique({ where: { token } });
    const user = magicLink ? await prisma.user.findUnique({ where: { email: magicLink.email } }) : null;

    if (!user || !user.isActive) {
      res.status(400).json(fail({ message: 'El enlace es inválido o ha expirado.', code: 'INVALID_TOKEN' }));
      return;
    }

    const sessionToken = await createSession(user.id);
    setSessionCookie(res, sessionToken);
    res.status(200).json(ok({ redirect: '/app' }));
  })
);

// POST /api/v1/auth/logout
authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[config.cookieName] as string | undefined;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    res.clearCookie(config.cookieName, { path: '/' });
    res.status(200).json(ok({ message: 'Sesión cerrada.' }));
  })
);

// GET /api/v1/auth/me
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    res.status(200).json(ok({ user: toUserDTO(req.user!) }));
  })
);

// GET /api/v1/auth/accept-invite?token=xxx
authRouter.get(
  '/accept-invite',
  asyncHandler(async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const invitation = token ? await prisma.invitation.findUnique({ where: { token } }) : null;
    const valid = Boolean(invitation && !invitation.usedAt && invitation.expiresAt > new Date());

    res.status(200).json(ok({ valid, email: valid ? invitation!.email : null }));
  })
);

// POST /api/v1/auth/accept-invite
authRouter.post(
  '/accept-invite',
  asyncHandler(async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

    if (!token) {
      res.status(400).json(fail({ message: 'La invitación es inválida.', code: 'INVALID_TOKEN' }));
      return;
    }

    if (name.length < 2 || name.length > 80) {
      res.status(400).json(fail({ message: 'Ingresa tu nombre (entre 2 y 80 caracteres).', code: 'INVALID_NAME' }));
      return;
    }

    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation || invitation.expiresAt < new Date()) {
      res.status(400).json(fail({ message: 'La invitación es inválida o ha expirado.', code: 'INVALID_TOKEN' }));
      return;
    }

    const claimed = await prisma.invitation.updateMany({
      where: { id: invitation.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() }
    });

    if (claimed.count === 0) {
      res.status(400).json(fail({ message: 'La invitación ya fue usada.', code: 'INVALID_TOKEN' }));
      return;
    }

    // Defensivo: si la cuenta ya existe, solo inicia sesión.
    let user = await prisma.user.findUnique({ where: { email: invitation.email } });
    if (!user) {
      user = await prisma.user.create({ data: { email: invitation.email, name, role: 'MEMBER' } });
    }

    const sessionToken = await createSession(user.id);
    setSessionCookie(res, sessionToken);
    res.status(200).json(ok({ redirect: '/app' }));
  })
);
