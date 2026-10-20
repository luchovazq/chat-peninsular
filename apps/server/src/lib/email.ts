import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

const transporter = config.smtp.host
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.pass }
        : undefined
    })
  : null;

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    // Sin SMTP configurado (desarrollo), se imprime el contenido para poder probar.
    logger.warn(`[email:dev] SMTP no configurado — no se envió a ${to}`);
    logger.info(`[email:dev] Asunto: ${subject}\n${html}`);
    return;
  }
  await transporter.sendMail({ from: config.smtp.from, to, subject, html });
}

export async function sendMagicLinkEmail(to: string, link: string): Promise<void> {
  const html = `
    <p>Hola,</p>
    <p>Alguien (esperemos que tú) solicitó acceso a Chat Peninsular.</p>
    <p><a href="${link}">Entrar ahora →</a></p>
    <p>Este enlace expira en 15 minutos y solo puede usarse una vez.</p>
    <p>Si no solicitaste esto, ignora este correo.</p>
    <p>— Chat Peninsular</p>
  `;
  await send(to, 'Tu enlace de acceso a Chat Peninsular', html);
}

export async function sendInvitationEmail(
  to: string,
  adminName: string,
  link: string
): Promise<void> {
  const html = `
    <p>Hola,</p>
    <p>${adminName} te invitó a unirte a Chat Peninsular,
    el espacio de comunicación interna de Caribe Peninsular.</p>
    <p><a href="${link}">Activar mi cuenta →</a></p>
    <p>Este enlace expira en 48 horas.</p>
    <p>— Chat Peninsular</p>
  `;
  await send(to, 'Te invitaron a Chat Peninsular', html);
}
