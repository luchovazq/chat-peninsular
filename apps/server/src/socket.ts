import type { Server as SocketIOServer } from 'socket.io';
import { logger } from './lib/logger';

/**
 * Socket.IO se inicializa aquí. En el hito 1 solo registra conexiones;
 * la presencia y los eventos de mensajes llegan en los hitos 2 y 3.
 */
export function setupSocket(io: SocketIOServer): void {
  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'socket conectado');

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'socket desconectado');
    });
  });
}
