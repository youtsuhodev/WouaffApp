import { Router } from 'express';
import type { Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../types/index.js';
import { getConversationsForUser, getGroupConversations } from '../services/rtdb.js';

const router: Router = Router();
router.use(verifyToken);

/* GET /conversations */
router.get('/', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const [dms, groups] = await Promise.all([
    getConversationsForUser(authReq.uid!),
    getGroupConversations(authReq.uid!),
  ]);
  res.json({ dms, groups });
});

export default router;
