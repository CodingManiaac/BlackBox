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
    
    // Compute dynamic SQLite metrics
    const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
    const totalOrders = db.prepare('SELECT COUNT(*) as cnt FROM orders').get().cnt;
    const activePharmacies = db.prepare("SELECT COUNT(*) as cnt FROM facilities WHERE type = 'Pharmacy'").get().cnt;
    const activeBloodBanks = db.prepare("SELECT COUNT(*) as cnt FROM facilities WHERE type = 'Blood Bank'").get().cnt;
    const activeHospitals = db.prepare("SELECT COUNT(*) as cnt FROM facilities WHERE type = 'Hospital'").get().cnt;
    
    // Emergency requests (eceLevel <= 2) and completion rate
    const contexts = db.prepare('SELECT context_json FROM requests_context').all();
    let emergencyRequests = 0;
    let completedWorkflows = 0;
    
    for (const row of contexts) {
      try {
        const ctx = JSON.parse(row.context_json);
        const ece = ctx.agentOutputs?.find((o: any) => o.agentId === 'ece')?.output;
        if (ece && ece.eceLevel <= 2) {
          emergencyRequests++;
        }
        if (ctx.status === 'COMPLETED' || ctx.status === 'Delivered') {
          completedWorkflows++;
        }
      } catch (e) {}
    }
    
    const workflowCompletionRate = contexts.length > 0 ? `${Math.round((completedWorkflows / contexts.length) * 100)}%` : '100%';

    res.json({ 
      success: true, 
      metrics: {
        ...metrics,
        totalUsers,
        totalOrders,
        activePharmacies,
        activeBloodBanks,
        activeHospitals,
        emergencyRequests,
        workflowCompletionRate
      } 
    });
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
