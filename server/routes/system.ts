import { Router, Request, Response, NextFunction } from 'express';
import { HealthMonitor } from '../../src/monitoring/HealthMonitor';

const router = Router();

router.get('/health', (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = HealthMonitor.getServicesHealth();
    res.json({ success: true, health });
  } catch (err) {
    next(err);
  }
});

export default router;
