import { Router } from 'express';
import type { Request, Response } from 'express';
import { searchByWouaffId, getProfile, getBadges } from '../services/rtdb.js';

const router: Router = Router();

router.get('/profile/:wouaffId', async (req: Request, res: Response) => {
  try {
    let wouaffId = req.params.wouaffId;
    if (!wouaffId.startsWith('@')) wouaffId = `@${wouaffId}`;
    const uid = await searchByWouaffId(wouaffId);
    if (!uid) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
    const [profile, badges] = await Promise.all([
      getProfile(uid),
      getBadges(),
    ]);
    if (!profile) { res.status(404).json({ error: 'Profil introuvable' }); return; }
    res.json({ uid, profile, badges });
  } catch {
    res.status(500).json({ error: 'Erreur lors du chargement du profil' });
  }
});

export default router;
