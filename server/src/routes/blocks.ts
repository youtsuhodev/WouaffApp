import { Router } from 'express';
import type { Request, Response } from 'express';
import { Server } from 'socket.io';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../types/index.js';
import { blockUser, unblockUser, getBlockedUids, reportUser } from '../services/rtdb.js';

const router: Router = Router();
router.use(verifyToken);

router.get('/', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const blocked = await getBlockedUids(authReq.uid!);
  res.json({ blocked });
});

router.post('/:uid/block', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const targetUid = req.params.uid;
  if (targetUid === authReq.uid) {
    res.status(400).json({ error: 'Vous ne pouvez pas vous bloquer vous-même' });
    return;
  }
  await blockUser(authReq.uid!, targetUid);
  const io: Server = req.app.get('io');
  if (io) {
    io.to(`user:${targetUid}`).emit('block:changed', { by: authReq.uid!, blocked: true });
  }
  res.json({ success: true });
});

router.post('/:uid/unblock', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  await unblockUser(authReq.uid!, req.params.uid);
  const io: Server = req.app.get('io');
  if (io) {
    io.to(`user:${req.params.uid}`).emit('block:changed', { by: authReq.uid!, blocked: false });
  }
  res.json({ success: true });
});

router.post('/:uid/report', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const targetUid = req.params.uid;
  if (targetUid === authReq.uid) {
    res.status(400).json({ error: 'Vous ne pouvez pas vous signaler vous-même' });
    return;
  }
  const { reason } = req.body as { reason?: string };
  await reportUser(targetUid, authReq.uid!, reason);
  res.json({ success: true });
});

export default router;
