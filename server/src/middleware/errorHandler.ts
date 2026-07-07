import type { Request, Response, NextFunction } from 'express';

/* Express 4-param error middleware — catches anything thrown or passed via next(err) */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const status = (err as any)?.status || 500;
  const message = (err as any)?.message || 'Erreur interne';
  if (status >= 500) {
    console.error('[ERROR]', (err as any)?.stack || message);
  }
  res.status(status).json({ error: status >= 500 ? 'Erreur interne' : message });
}

/* Graceful shutdown */
export function setupProcessHandlers(cleanup?: () => Promise<void>): void {
  process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT]', err.stack || err.message);
    if (cleanup) cleanup().finally(() => process.exit(1));
    else process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED]', (reason as any)?.stack || (reason as any)?.message || reason);
  });

  process.on('SIGTERM', () => {
    console.log('[SIGTERM] Arrêt demandé');
    if (cleanup) cleanup().finally(() => process.exit(0));
    else process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('[SIGINT] Arrêt demandé');
    if (cleanup) cleanup().finally(() => process.exit(0));
    else process.exit(0);
  });
}
