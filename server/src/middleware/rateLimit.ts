import type { NextFunction, Request, Response } from 'express';

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/* Simple in-memory sliding-window rate limiter */
export function rateLimit(opts: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message } = opts;
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = store.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }
    entry.count++;
    if (entry.count > max) {
      res.status(429).json({ error: message || 'Trop de requêtes, réessayez plus tard' });
      return;
    }
    next();
  };
}

/* Periodic cleanup of stale entries */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60000);
