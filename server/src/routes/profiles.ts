import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Server } from 'socket.io';
import { verifyToken } from '../middleware/auth.js';
import { deleteUserProfile, getMutualContacts, getProfile, getPublicKey, getReverseContactUids, updateProfile } from '../services/rtdb.js';
import type { AuthRequest } from '../types/index.js';

const router: Router = Router();
router.use(verifyToken);

/* GET /profiles/me — mon propre profil */
router.get('/me', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const profile = await getProfile(authReq.uid!);
  if (!profile) {
    res.status(404).json({ error: 'Profil introuvable' });
    return;
  }
  res.json(profile);
});

/* GET /profiles/:uid */
router.get('/:uid', async (req: Request, res: Response) => {
  const profile = await getProfile(req.params.uid);
  if (!profile) {
    res.status(404).json({ error: 'Profil introuvable' });
    return;
  }
  res.json(profile);
});

/* GET /profiles/:uid/mutual — amis en commun */
router.get('/:uid/mutual', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const mutual = await getMutualContacts(authReq.uid!, req.params.uid);
  res.json(mutual);
});

/* GET /profiles/:uid/publicKey */
router.get('/:uid/publicKey', async (req: Request, res: Response) => {
  const key = await getPublicKey(req.params.uid);
  res.json({ publicKey: key });
});

/* PUT /profiles/me — mettre à jour mon profil */
router.put('/me', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  await updateProfile(authReq.uid!, req.body);
  const io: Server = req.app.get('io');
  if (io) {
    const contactUids = await getReverseContactUids(authReq.uid!);
    for (const cu of contactUids) {
      io.to(`user:${cu}`).emit('profile:updated', { uid: authReq.uid!, ...req.body });
    }
  }
  res.json({ success: true });
});

/* DELETE /profiles/me — supprimer mon compte */
router.delete('/me', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  await deleteUserProfile(authReq.uid!);
  const io: Server = req.app.get('io');
  if (io) {
    const contactUids = await getReverseContactUids(authReq.uid!);
    for (const cu of contactUids) {
      io.to(`user:${cu}`).emit('account:deleted', { uid: authReq.uid! });
    }
  }
  res.json({ success: true });
});

/* PUT /profiles/me/publicKey — mettre à jour ma clé publique E2EE */
router.put('/me/publicKey', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { publicKey } = req.body as { publicKey: Record<string, unknown> };
  if (!publicKey) {
    res.status(400).json({ error: 'Clé publique requise' });
    return;
  }
  await updateProfile(authReq.uid!, { publicKey });
  const io: Server = req.app.get('io');
  if (io) {
    const contactUids = await getReverseContactUids(authReq.uid!);
    for (const cu of contactUids) {
      io.to(`user:${cu}`).emit('key:changed', { uid: authReq.uid! });
    }
  }
  res.json({ success: true });
});

export default router;
