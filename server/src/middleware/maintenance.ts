import type { NextFunction, Request, Response } from 'express';
import { getMaintenanceMode, isStaff } from '../services/rtdb.js';
import type { AuthRequest } from '../types/index.js';

export function maintenanceCheck(req: Request, res: Response, next: NextFunction): void {
  getMaintenanceMode()
    .then(async ({ enabled, message }) => {
      if (!enabled) return next();
      const authReq = req as AuthRequest;
      if (authReq.uid) {
        const staff = await isStaff(authReq.uid);
        if (staff) return next();
      }
      res.status(503).json({ error: message || 'Application en maintenance, réessayez plus tard.' });
    })
    .catch(next);
}
