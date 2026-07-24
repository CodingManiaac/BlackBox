import { Router, Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = OrderService.getOrderHistory();
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/rider', (req: Request, res: Response, next: NextFunction) => {
  const { riderName, eta } = req.body;
  if (!riderName || !eta) {
    res.status(400).json({ success: false, message: 'Missing riderName or eta.' });
    return;
  }

  try {
    OrderService.assignRider(req.params.id, riderName, eta);
    res.json({ success: true, message: 'Rider assigned successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
