import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { getOne, query } from '../config/database.js';
import type { AuthRequest } from '../types/index.js';

export async function verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.cookies?.session_id;
  if (!sessionId) {
    res.status(401).json({ error: 'Session manquante' });
    return;
  }
  const session = await getOne<{ uid: string }>('SELECT uid FROM sessions WHERE sessionId = ?', [sessionId]);
  if (!session) {
    res.clearCookie('session_id');
    res.status(401).json({ error: 'Session invalide' });
    return;
  }
  (req as AuthRequest).uid = session.uid;
  next();
}

export async function createSession(uid: string): Promise<{ sessionId: string }> {
  const sessionId = randomUUID().replace(/-/g, '');
  await query('INSERT INTO sessions (sessionId, uid, createdAt) VALUES (?,?,?)', [sessionId, uid, Date.now()]);
  return { sessionId };
}

export async function destroySession(sessionId: string): Promise<void> {
  await query('DELETE FROM sessions WHERE sessionId = ?', [sessionId]);
}
