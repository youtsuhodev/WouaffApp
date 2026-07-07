import type { Request, Response } from 'express';
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { removeFcmToken, setFcmToken } from '../services/rtdb.js';
import type { AuthRequest } from '../types/index.js';

const router: Router = Router();
router.use(verifyToken);

/* POST /notifications/fcm-token — enregistrer un token FCM */
router.post('/fcm-token', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { token } = req.body as { token: string };
  if (!token) {
    res.status(400).json({ error: 'Token requis' });
    return;
  }
  await setFcmToken(authReq.uid!, token);
  res.json({ success: true });
});

/* DELETE /notifications/fcm-token — supprimer un token FCM */
router.delete('/fcm-token', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { token } = req.body as { token: string };
  if (!token) {
    res.status(400).json({ error: 'Token requis' });
    return;
  }
  await removeFcmToken(authReq.uid!, token);
  res.json({ success: true });
});

export default router;
