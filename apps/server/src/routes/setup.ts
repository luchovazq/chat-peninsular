import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ok, fail } from '../lib/response';
import { asyncHandler } from '../middleware/error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const setupRouter = Router();

// GET /api/v1/setup — indica si falta completar el setup inicial.
setupRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const count = await prisma.user.count();
    res.status(200).json(ok({ needsSetup: count === 0 }));
  })
);

// POST /api/v1/setup — crea el primer admin y el canal #general (spec 05).
setupRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

    if (!EMAIL_RE.test(email)) {
      res.status(400).json(fail({ message: 'Ingresa un email válido.', code: 'INVALID_EMAIL' }));
      return;
    }

    if (name.length < 2 || name.length > 80) {
      res.status(400).json(fail({ message: 'Ingresa tu nombre (entre 2 y 80 caracteres).', code: 'INVALID_NAME' }));
      return;
    }

    const count = await prisma.user.count();
    if (count > 0) {
      res.status(403).json(fail({ message: 'El setup ya fue completado.', code: 'SETUP_DONE' }));
      return;
    }

    const admin = await prisma.user.create({ data: { email, name, role: 'ADMIN' } });
    const channel = await prisma.channel.create({
      data: { name: 'general', description: 'Canal principal del equipo', createdById: admin.id }
    });
    await prisma.channelMember.create({
      data: { channelId: channel.id, userId: admin.id, role: 'MODERATOR' }
    });

    res.status(201).json(ok({ message: 'Setup completado. Ahora inicia sesión con tu magic link.' }));
  })
);
