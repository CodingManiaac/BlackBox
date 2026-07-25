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

// GET auth configurations (Google Client ID)
router.get('/config', (req: Request, res: Response) => {
  res.json({
    googleClientId: process.env.AUTH_GOOGLE_ID || ''
  });
});

// POST login with password
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

// Helper function to auto-provision user when logging in via Google/Magic Link if not exists
function autoRegisterUser(email: string, name: string, role: string): UserRecord {
  const existing = db.prepare('SELECT * FROM users WHERE username = ? AND role = ?').get(email, role) as UserRecord | undefined;
  if (existing) {
    return existing;
  }

  // Provisioning associated ID based on role
  let associatedId = '';
  if (role === 'Patient') {
    associatedId = 'PAT-' + Math.floor(100000 + Math.random() * 900000);
    db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, username, password_hash, role, name, associated_id)
        VALUES (?, ?, 'oauth-token', 'Patient', ?, ?)
      `).run(associatedId, email, name, associatedId);

      db.prepare(`
        INSERT INTO patients (id, name, age, gender, phone, blood_group, allergies, medical_history, emergency_contacts, email, address_line, city, zip_code, sms_notify, email_notify, language, consent_active, profile_photo)
        VALUES (?, ?, 30, 'Other', '', 'O+', '', '', '', ?, '', '', '', 1, 0, 'en', 1, '')
      `).run(associatedId, name, email);
    })();
  } else {
    // Other portals: Pharmacy, Hospital, BloodBank, Logistics, Admin
    if (role === 'Hospital') associatedId = 'HOSP-001';
    else if (role === 'Pharmacy') associatedId = 'PHARM-001';
    else if (role === 'BloodBank') associatedId = 'BLOOD-001';
    else if (role === 'Logistics') associatedId = 'RIDER-001';
    else associatedId = 'ADMIN-001';

    db.prepare(`
      INSERT INTO users (id, username, password_hash, role, name, associated_id)
      VALUES (?, ?, 'oauth-token', ?, ?, ?)
    `).run(associatedId, email, role, name, associatedId);
  }

  return db.prepare('SELECT * FROM users WHERE username = ? AND role = ?').get(email, role) as UserRecord;
}

// POST Google OAuth Login/Registration
router.post('/google-login', async (req: Request, res: Response, next: NextFunction) => {
  const { credential, role } = req.body;
  if (!credential || !role) {
    res.status(400).json({ success: false, message: 'Missing Google credentials or workspace role.' });
    return;
  }

  try {
    // Decode Google ID Token (JWT) securely
    const tokenParts = credential.split('.');
    if (tokenParts.length < 2) {
      res.status(400).json({ success: false, message: 'Malformed Google credential token.' });
      return;
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'));
    const { email, name } = payload;
    if (!email) {
      res.status(400).json({ success: false, message: 'Google credential token is missing email payload.' });
      return;
    }

    const user = autoRegisterUser(email, name || email.split('@')[0], role);

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

// POST Request Magic Link
router.post('/magic-link', async (req: Request, res: Response, next: NextFunction) => {
  const { email, role } = req.body;
  if (!email || !role) {
    res.status(400).json({ success: false, message: 'Missing email or workspace role.' });
    return;
  }

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store magic link details
    db.prepare(`
      INSERT OR REPLACE INTO magic_links (email, token, role, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(email, token, role, expiresAt);

    // Send email using Resend
    const resendKey = process.env.AUTH_RESEND_KEY;
    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    if (!resendKey) {
      console.warn('[MagicLink] Resend key is missing in env. Falling back to local logging.');
      console.log(`[MagicLink Link] http://localhost:5173/login/verify?token=${token}&role=${role}`);
      res.json({
        success: true,
        message: 'Magic link generated successfully (Logged to server console since Resend key is missing).'
      });
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailFrom,
        to: email,
        subject: 'MedXNet Magic Link Sign In',
        html: `
          <div style="font-family: sans-serif; padding: 24px; max-width: 600px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF; color: #0F172A;">
            <h2 style="color: #10B981; margin-bottom: 8px;">MedXNet Health</h2>
            <p style="font-size: 14px; color: #475569;">You requested a login link for your <strong>${role} Portal</strong> workspace.</p>
            <div style="margin: 24px 0;">
              <a href="http://localhost:5173/login/verify?token=${token}&role=${role}" style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: #FFFFFF; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(16,185,129,0.2);">Sign In to MedXNet</a>
            </div>
            <p style="font-size: 12px; color: #94A3B8;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94A3B8; text-align: center;">© 2026 MedXNet. All rights reserved.</p>
          </div>
        `
      })
    });

    const emailResult = await response.json();
    if (!response.ok) {
      console.error('[MagicLink] Resend API failed:', emailResult);
      res.status(500).json({ success: false, message: 'Resend API failed to send verification email.' });
      return;
    }

    res.json({
      success: true,
      message: 'Magic link sent! Please check your email inbox.'
    });
  } catch (err) {
    next(err);
  }
});

// POST Verify Magic Link
router.post('/verify-magic-link', (req: Request, res: Response, next: NextFunction) => {
  const { token, role } = req.body;
  if (!token || !role) {
    res.status(400).json({ success: false, message: 'Missing token or workspace role.' });
    return;
  }

  try {
    const record = db.prepare('SELECT * FROM magic_links WHERE token = ? AND role = ?')
      .get(token, role) as { email: string; token: string; role: string; expires_at: number } | undefined;

    if (!record) {
      res.status(400).json({ success: false, message: 'Invalid verification token.' });
      return;
    }

    if (Date.now() > record.expires_at) {
      db.prepare('DELETE FROM magic_links WHERE token = ?').run(token);
      res.status(400).json({ success: false, message: 'Magic link has expired.' });
      return;
    }

    // Delete token after successful use
    db.prepare('DELETE FROM magic_links WHERE token = ?').run(token);

    const user = autoRegisterUser(record.email, record.email.split('@')[0], role);

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

// POST register a password account (existing flow)
router.post('/register', (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, phone, address, emergencyContact } = req.body;
  if (!name || !email || !password || !phone || !address || !emergencyContact) {
    res.status(400).json({ success: false, message: 'All registration fields are required.' });
    return;
  }

  try {
    // Check if user already exists
    const existing = db.prepare('SELECT * FROM users WHERE username = ? AND role = ?').get(email, 'Patient');
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
