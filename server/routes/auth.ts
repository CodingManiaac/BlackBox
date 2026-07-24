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

export default router;
