import { Router, Request, Response, NextFunction } from 'express';
import { PatientService } from '../services/PatientService';
import { PatientRepository } from '../repositories/PatientRepository';
import { NotificationEngine } from '../services/NotificationEngine';
import { db } from '../database/db';

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = PatientService.getAllPatients();
    res.json({ success: true, patients: list });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = PatientService.getPatientProfile(req.params.id);
    res.json({ success: true, patient: profile });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/notifications', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const list = NotificationEngine.getNotifications(id);
    res.json({ success: true, notifications: list });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/settings', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const settings = req.body;
    PatientRepository.updateSettings(id, settings);
    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/notifications', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM notifications WHERE patient_id = ?').run(id);
    res.json({ success: true, message: 'Notifications cleared.' });
  } catch (err) {
    next(err);
  }
});

export default router;
