import { Router, Request, Response, NextFunction } from 'express';
import { LogisticsService } from '../services/LogisticsService';

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
    LogisticsService.assignRiderToOrder(riderId, req.params.id);
    res.json({ success: true, message: 'Order dispatched with rider.' });
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

export default router;
