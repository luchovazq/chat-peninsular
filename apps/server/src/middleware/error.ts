import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { fail } from '../lib/response';
import { logger } from '../lib/logger';

type AsyncHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Envuelve un handler async para que cualquier error rechazado llegue a
 * Express y no quede sin capturar.
 */
export function asyncHandler<Req extends Request = Request>(
  handler: AsyncHandler<Req>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as Req, res, next)).catch(next);
  };
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json(fail({ message: 'Recurso no encontrado.', code: 'NOT_FOUND' }));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err);
  res.status(500).json(fail({ message: 'Error interno del servidor.', code: 'INTERNAL' }));
}
