import { Router } from 'express';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';
import { generateToken } from '../lib/tokens';
import { sendInvitationEmail } from '../lib/email';
import { ok, fail } from '../lib/response';
import { asyncHandler } from '../middleware/error';
import { requireAuth, requireAdmin, type AuthedRequest } from '../middleware/auth';
import { toInvitationDTO } from '../lib/dto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

// POST /api/v1/admin/invitations
adminRouter.post(
  '/invitations',
  asyncHandler<AuthedRequest>(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!EMAIL_RE.test(email)) {
      res.status(400).json(fail({ message: 'Ingresa un email válido.', code: 'INVALID_EMAIL' }));
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json(fail({ message: 'Este email ya tiene una cuenta.', code: 'EMAIL_EXISTS' }));
      return;
    }

    const token = generateToken();
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        invitedById: req.userId!,
        expiresAt: new Date(Date.now() + config.invitationTtlHours * 60 * 60 * 1000)
      }
    });

    await sendInvitationEmail(email, req.user!.name, `${config.appUrl}/auth/accept-invite?token=${token}`);

    res.status(201).json(ok({ invitation: toInvitationDTO(invitation) }));
  })
);

// GET /api/v1/admin/invitations
adminRouter.get(
  '/invitations',
  asyncHandler(async (_req, res) => {
    const invitations = await prisma.invitation.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json(ok({ invitations: invitations.map(toInvitationDTO) }));
  })
);
