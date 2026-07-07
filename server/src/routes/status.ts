import { Router } from 'express';
import type { Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../types/index.js';
import { setUserOnline, setUserOffline, getReverseContactUids } from '../services/rtdb.js';

async function broadcastStatusChange(req: Request, uid: string, status: string) {
  try {
    const io = req.app.get('io');
    if (!io) return;
    const contactUids = await getReverseContactUids(uid);
    for (const contactUid of contactUids) {
      io.to(`user:${contactUid}`).emit('status:changed', { uid, status });
    }
  } catch (err) {
    console.error('broadcastStatusChange error:', err);
  }
}

const router: Router = Router();
router.use(verifyToken);

/* POST /status/online */
router.post('/online', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  await setUserOnline(authReq.uid!);
  broadcastStatusChange(req, authReq.uid!, 'online');
  res.json({ success: true });
});

/* POST /status/offline */
router.post('/offline', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  await setUserOffline(authReq.uid!);
  broadcastStatusChange(req, authReq.uid!, 'offline');
  res.json({ success: true });
});

export default router;
