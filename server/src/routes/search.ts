import type { Request, Response } from 'express';
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getAllWouaffIds, getProfile, searchByWouaffId } from '../services/rtdb.js';
import type { AuthRequest } from '../types/index.js';

const router: Router = Router();
router.use(verifyToken);

/* GET /search/users?q=@pseudo — rechercher un utilisateur */
router.get('/users', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const q = ((req.query.q as string) || '').trim().toLowerCase();
  if (!q) {
    res.json({ results: [] });
    return;
  }
  const allIds = await getAllWouaffIds();
  const results: Array<{ uid: string; wouaffId: string; profile: Record<string, unknown> | null }> = [];
  for (const [wouaffId, uid] of Object.entries(allIds)) {
    if (uid === authReq.uid) continue;
    const displayId = wouaffId.startsWith('@') ? wouaffId : `@${wouaffId}`;
    if (displayId.toLowerCase().includes(q) || displayId.replace('@', '').includes(q)) {
      const profile = await getProfile(uid as string);
      results.push({ uid: uid as string, wouaffId: displayId, profile });
    }
    if (results.length >= 20) break;
  }
  res.json({ results });
});

/* GET /search/users/:wouaffId — recherche exacte par @ */
router.get('/users/:wouaffId', async (req: Request, res: Response) => {
  let wouaffId = req.params.wouaffId;
  if (!wouaffId.startsWith('@')) wouaffId = `@${wouaffId}`;
  const uid = await searchByWouaffId(wouaffId);
  if (!uid) {
    res.status(404).json({ error: 'Utilisateur introuvable' });
    return;
  }
  const profile = await getProfile(uid);
  res.json({ uid, profile });
});

export default router;
