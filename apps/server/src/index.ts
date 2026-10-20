import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/env';
import { createApp } from './app';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';
import { setupSocket } from './socket';

async function main(): Promise<void> {
  const app = createApp();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: true, credentials: true }
  });
  setupSocket(io);

  await prisma.$connect();
  server.listen(config.port, () => {
    logger.info(`Servidor escuchando en http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
