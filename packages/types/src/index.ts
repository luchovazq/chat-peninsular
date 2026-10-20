// ============================================================================
// @chat-peninsular/types — Tipos compartidos entre apps/web y apps/server
// ============================================================================

// ----------------------------------------------------------------------------
// Roles
// ----------------------------------------------------------------------------

export const WORKSPACE_ROLES = ['ADMIN', 'MEMBER'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const CHANNEL_ROLES = ['MODERATOR', 'MEMBER'] as const;
export type ChannelRole = (typeof CHANNEL_ROLES)[number];

// ----------------------------------------------------------------------------
// Respuesta estándar de la API ({ data, error })
// ----------------------------------------------------------------------------

export interface ApiError {
  message: string;
  code: string;
}

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

// ----------------------------------------------------------------------------
// Entidades (DTOs enviados al cliente)
// ----------------------------------------------------------------------------

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: WorkspaceRole;
  isActive: boolean;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface AuthorDTO {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ChannelDTO {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isArchived: boolean;
  createdAt: string;
  memberCount: number;
  isMember: boolean;
}

export interface MessageDTO {
  id: string;
  content: string | null;
  imageUrl: string | null;
  author: AuthorDTO;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface InvitationDTO {
  id: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// Auth
// ----------------------------------------------------------------------------

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkResponse {
  message: string;
}

export interface VerifyRequest {
  token: string;
}

export interface VerifyResponse {
  redirect: string;
}

export interface MeResponse {
  user: UserDTO;
}

export interface AcceptInviteInfo {
  valid: boolean;
  email: string | null;
}

export interface AcceptInviteRequest {
  token: string;
  name: string;
}

export interface AcceptInviteResponse {
  redirect: string;
}

export interface SetupStatusResponse {
  needsSetup: boolean;
}

export interface SetupRequest {
  email: string;
  name: string;
}

export interface SetupResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

// ----------------------------------------------------------------------------
// Admin
// ----------------------------------------------------------------------------

export interface CreateInvitationRequest {
  email: string;
}

export interface CreateInvitationResponse {
  invitation: InvitationDTO;
}

export interface ListInvitationsResponse {
  invitations: InvitationDTO[];
}

// ----------------------------------------------------------------------------
// Socket.IO (nombres de eventos)
// ----------------------------------------------------------------------------

export const SOCKET_EVENTS = {
  // Cliente → Servidor
  messageSend: 'message:send',
  messageEdit: 'message:edit',
  messageDelete: 'message:delete',
  channelJoin: 'channel:join',
  channelLeave: 'channel:leave',
  typingStart: 'typing:start',
  typingStop: 'typing:stop',
  presencePing: 'presence:ping',

  // Servidor → Cliente
  messageNew: 'message:new',
  messageUpdated: 'message:updated',
  messageDeleted: 'message:deleted',
  userPresence: 'user:presence',
  typingUpdate: 'typing:update'
} as const;
