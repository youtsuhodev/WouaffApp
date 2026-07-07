import { Router } from 'express';
import type { Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import type { AuthRequest } from '../types/index.js';
import { query } from '../config/database.js';
import { isColdStorageEnabled, getArchivedCall, getUserCalls } from '../services/coldStorage.js';

const router: Router = Router();
router.use(verifyToken);

interface CallRow {
  id: string;
  callerUid: string;
  calleeUid: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: string;
}

/* GET /calls/history — historique des appels de l'utilisateur connecté */
router.get('/history', async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const uid = authReq.uid!;
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const calls = await getUserCalls(uid, limit);
    res.json({ calls });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du chargement de l\'historique' });
  }
});

/* GET /calls/:id — détail d'un appel spécifique (MySQL d'abord, puis GCS) */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const row = await query<CallRow[]>('SELECT * FROM calls WHERE id = ?', [id]);
    if (row.length > 0) {
      res.json({ call: row[0], source: 'mysql' });
      return;
    }
    if (isColdStorageEnabled()) {
      const archived = await getArchivedCall(id);
      if (archived) {
        res.json({ call: archived, source: 'gcs' });
        return;
      }
    }
    res.status(404).json({ error: 'Appel introuvable' });
  } catch {
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

export default router;
