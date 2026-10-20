import type { UserDTO, InvitationDTO } from '@chat-peninsular/types';
import type { User, Invitation } from '@prisma/client';

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    lastSeenAt: user.lastSeenAt ? user.lastSeenAt.toISOString() : null
  };
}

export function toInvitationDTO(invitation: Invitation): InvitationDTO {
  return {
    id: invitation.id,
    email: invitation.email,
    expiresAt: invitation.expiresAt.toISOString(),
    usedAt: invitation.usedAt ? invitation.usedAt.toISOString() : null,
    createdAt: invitation.createdAt.toISOString()
  };
}
