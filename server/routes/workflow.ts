import { Router, Request, Response, NextFunction } from 'express';
import { WorkflowOrchestrator } from '../services/WorkflowOrchestrator';
import { NotificationEngine } from '../services/NotificationEngine';
import { db } from '../database/db';

const router = Router();

router.get('/requests', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = db.prepare('SELECT * FROM requests_context ORDER BY timestamp DESC LIMIT 50').all();
    res.json({ success: true, contexts: list });
  } catch (err) {
    next(err);
  }
});

router.get('/notifications', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = NotificationEngine.getNotifications();
    res.json({ success: true, notifications: list });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/accept', (req: Request, res: Response, next: NextFunction) => {
  const { facilityId, remarks } = req.body;
  try {
    WorkflowOrchestrator.acceptRequest(req.params.id, facilityId || 'FAC-003', remarks);
    res.json({ success: true, message: 'Request accepted and review started.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/verify-prescription', (req: Request, res: Response, next: NextFunction) => {
  try {
    WorkflowOrchestrator.verifyPrescription(req.params.id);
    res.json({ success: true, message: 'Prescription verified.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reserve-inventory', (req: Request, res: Response, next: NextFunction) => {
  try {
    WorkflowOrchestrator.reserveInventory(req.params.id);
    res.json({ success: true, message: 'Inventory reserved.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/mark-out-of-stock', (req: Request, res: Response, next: NextFunction) => {
  try {
    WorkflowOrchestrator.markOutOfStock(req.params.id);
    res.json({ success: true, message: 'Order marked out of stock.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/suggest-alternative', (req: Request, res: Response, next: NextFunction) => {
  const { alternative } = req.body;
  try {
    WorkflowOrchestrator.suggestAlternative(req.params.id, alternative || 'Generic Drug Alternative');
    res.json({ success: true, message: 'Alternative medicine suggested.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reject', (req: Request, res: Response, next: NextFunction) => {
  const { remarks } = req.body;
  try {
    WorkflowOrchestrator.rejectRequest(req.params.id, remarks || 'Item out of stock.');
    res.json({ success: true, message: 'Request rejected.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', (req: Request, res: Response, next: NextFunction) => {
  try {
    WorkflowOrchestrator.cancelRequest(req.params.id);
    res.json({ success: true, message: 'Request cancelled successfully.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/ready', (req: Request, res: Response, next: NextFunction) => {
  try {
    WorkflowOrchestrator.readyRequest(req.params.id);
    res.json({ success: true, message: 'Request marked ready for pickup.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/dispatch', (req: Request, res: Response, next: NextFunction) => {
  const { riderId } = req.body;
  try {
    WorkflowOrchestrator.assignRider(req.params.id, riderId || 'RD-001');
    res.json({ success: true, message: 'Rider assigned to order.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reached-store', (req: Request, res: Response, next: NextFunction) => {
  try {
    WorkflowOrchestrator.reachedStore(req.params.id);
    res.json({ success: true, message: 'Rider arrived at store.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/ship', (req: Request, res: Response, next: NextFunction) => {
  try {
    WorkflowOrchestrator.shipOrder(req.params.id);
    res.json({ success: true, message: 'Order shipped and out for delivery.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reached-customer', (req: Request, res: Response, next: NextFunction) => {
  try {
    WorkflowOrchestrator.reachedCustomer(req.params.id);
    res.json({ success: true, message: 'Rider reached customer location.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/complete', (req: Request, res: Response, next: NextFunction) => {
  try {
    WorkflowOrchestrator.completeDelivery(req.params.id);
    res.json({ success: true, message: 'Delivery completed successfully.' });
  } catch (err) {
    next(err);
  }
});

// Admin overrides
router.post('/:id/override-status', (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  try {
    WorkflowOrchestrator.updateStage(req.params.id, status || 'COMPLETED');
    res.json({ success: true, message: 'Workflow state status overridden.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/force-reassign', (req: Request, res: Response, next: NextFunction) => {
  const { pharmacy, rider } = req.body;
  try {
    if (pharmacy) {
      db.prepare('UPDATE orders SET assigned_pharmacy = ? WHERE id = ?').run(pharmacy, req.params.id);
    }
    if (rider) {
      db.prepare('UPDATE orders SET assigned_rider = ? WHERE id = ?').run(rider, req.params.id);
    }
    WorkflowOrchestrator.updateStage(req.params.id, 'MANUAL_REVIEW', { pharmacy, rider });
    res.json({ success: true, message: 'Reassigned successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
