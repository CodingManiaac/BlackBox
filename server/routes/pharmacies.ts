import { Router, Request, Response, NextFunction } from 'express';
import { PharmacyService } from '../services/PharmacyService';
import { InventoryService } from '../services/InventoryService';
import { db } from '../database/db';

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

router.post('/inventory/restock', (req: Request, res: Response, next: NextFunction) => {
  const { medicine, quantity } = req.body;
  if (!medicine || quantity === undefined) {
    res.status(400).json({ success: false, message: 'Missing medicine or quantity.' });
    return;
  }
  try {
    db.prepare(`
      INSERT INTO inventory (medicine, quantity, expiry, cold_chain_flag, alternatives)
      VALUES (?, ?, '2028-12-31', 0, 'Generic alternative')
      ON CONFLICT(medicine) DO UPDATE SET quantity = quantity + excluded.quantity
    `).run(medicine, Number(quantity));
    res.json({ success: true, message: `Successfully restocked ${medicine}.` });
  } catch (err) {
    next(err);
  }
});

router.get('/verifications', (req: Request, res: Response, next: NextFunction) => {
  try {
    const queue = db.prepare('SELECT * FROM prescription_verifications').all();
    res.json({ success: true, queue });
  } catch (err) {
    next(err);
  }
});

router.post('/verifications/status', (req: Request, res: Response, next: NextFunction) => {
  const { id, status, notes } = req.body;
  if (!id || !status) {
    res.status(400).json({ success: false, message: 'Missing id or status.' });
    return;
  }
  try {
    db.prepare('UPDATE prescription_verifications SET status = ?, notes = ? WHERE id = ?').run(status, notes || '', id);
    res.json({ success: true, message: 'Prescription status updated successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
