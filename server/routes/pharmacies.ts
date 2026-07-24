import { Router, Request, Response, NextFunction } from 'express';
import { PharmacyService } from '../services/PharmacyService';
import { InventoryService } from '../services/InventoryService';

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = PharmacyService.getNearbyPharmacies();
    res.json({ success: true, pharmacies: list });
  } catch (err) {
    next(err);
  }
});

router.get('/inventory', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = InventoryService.getMedicines();
    res.json({ success: true, inventory: list });
  } catch (err) {
    next(err);
  }
});

export default router;
