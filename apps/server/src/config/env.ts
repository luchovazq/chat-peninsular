import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: required('DATABASE_URL'),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  cookieName: 'session',
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS ?? 30),
  magicLinkTtlMinutes: 15,
  invitationTtlHours: 48,
  isProduction: process.env.NODE_ENV === 'production',
  smtp: {
    host: process.env.SMTP_HOST || undefined,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER || undefined,
    pass: process.env.SMTP_PASS || undefined,
    from: process.env.SMTP_FROM ?? 'Chat Peninsular <noreply@localhost>'
  }
} as const;
