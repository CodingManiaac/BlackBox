import { Router, Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/AuditService';
import { MetricsCollector } from '../../src/monitoring/MetricsCollector';
import { AgentMonitor } from '../../src/monitoring/AgentMonitor';
import { db } from '../database/db';

const router = Router();

// Start collectors in backend process
MetricsCollector.startTracking();
AgentMonitor.startTracking();

router.get('/audit-logs', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = AuditService.getLogs();
    res.json({ success: true, logs: list });
  } catch (err) {
    next(err);
  }
});

router.get('/metrics', (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = MetricsCollector.getMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    next(err);
  }
});

router.get('/agents', (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = AgentMonitor.getTrackers();
    res.json({ success: true, agents });
  } catch (err) {
    next(err);
  }
});

router.get('/contexts', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = db.prepare('SELECT * FROM requests_context ORDER BY timestamp DESC LIMIT 50').all();
    res.json({ success: true, contexts: list });
  } catch (err) {
    next(err);
  }
});

export default router;
