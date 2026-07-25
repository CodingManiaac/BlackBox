import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database/db';
import crypto from 'crypto';

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

interface UserRecord {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  name: string;
  associated_id: string | null;
}

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    res.status(400).json({ success: false, message: 'Missing username, password, or role.' });
    return;
  }

  try {
    const passwordHash = hashPassword(password);
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password_hash = ? AND role = ?')
      .get(username, passwordHash, role) as UserRecord | undefined;

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid username, password, or workspace role.' });
      return;
    }

    res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        name: user.name,
        associatedId: user.associated_id
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/register', (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, phone, address, emergencyContact } = req.body;
  if (!name || !email || !password || !phone || !address || !emergencyContact) {
    res.status(400).json({ success: false, message: 'All registration fields are required.' });
    return;
  }

  try {
    // Check if user already exists
    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(email);
    if (existing) {
      res.status(400).json({ success: false, message: 'Account with this email already exists.' });
      return;
    }

    const patientId = 'PAT-' + Math.floor(100000 + Math.random() * 900000);
    const passwordHash = hashPassword(password);

    db.transaction(() => {
      // 1. Create user credential entry
      db.prepare(`
        INSERT INTO users (id, username, password_hash, role, name, associated_id)
        VALUES (?, ?, ?, 'Patient', ?, ?)
      `).run(patientId, email, passwordHash, name, patientId);

      // 2. Create patient profile entry
      db.prepare(`
        INSERT INTO patients (id, name, age, gender, phone, blood_group, allergies, medical_history, emergency_contacts, email, address_line, city, zip_code, sms_notify, email_notify, language, consent_active, profile_photo)
        VALUES (?, ?, 30, 'Other', ?, 'O+', '', '', ?, ?, ?, '', '', 1, 0, 'en', 1, '')
      `).run(patientId, name, phone, emergencyContact, email, address);
    })();

    res.json({ success: true, message: 'Registration successful! Please log in.' });
  } catch (err) {
    next(err);
  }
});

export default router;
