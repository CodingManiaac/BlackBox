import { Router, Request, Response, NextFunction } from 'express';
import { LogisticsService } from '../services/LogisticsService';
import { db } from '../database/db';

const router = Router();

router.get('/riders', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = LogisticsService.getRiders();
    res.json({ success: true, riders: list });
  } catch (err) {
    next(err);
  }
});

router.post('/orders/:id/dispatch', (req: Request, res: Response, next: NextFunction) => {
  const { riderId } = req.body;
  if (!riderId) {
    res.status(400).json({ success: false, message: 'Missing riderId.' });
    return;
  }

  try {
    LogisticsService.dispatchDelivery(req.params.id, riderId);
    res.json({ success: true, message: 'Delivery dispatched.' });
  } catch (err) {
    next(err);
  }
});

router.post('/orders/:id/complete', (req: Request, res: Response, next: NextFunction) => {
  try {
    LogisticsService.completeDelivery(req.params.id);
    res.json({ success: true, message: 'Delivery completed successfully.' });
  } catch (err) {
    next(err);
  }
});

router.get('/drones', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = db.prepare('SELECT * FROM drones').all();
    res.json({ success: true, drones: list });
  } catch (err) {
    next(err);
  }
});

router.post('/drones/update', (req: Request, res: Response, next: NextFunction) => {
  const { id, battery, status } = req.body;
  if (!id) {
    res.status(400).json({ success: false, message: 'Missing drone id.' });
    return;
  }
  try {
    db.prepare('UPDATE drones SET battery = ?, status = ? WHERE id = ?').run(Number(battery), status, id);
    res.json({ success: true, message: 'Drone status updated.' });
  } catch (err) {
    next(err);
  }
});

export default router;
