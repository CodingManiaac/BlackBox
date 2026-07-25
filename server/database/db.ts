import Database from 'better-sqlite3';
import { SCHEMA } from './schema';
import path from 'path';

const dbPath = path.resolve('server/database/medxnet.db');
const db = new Database(dbPath);

// Drop legacy blood_banks table if it lacks facility_id column
try {
  db.prepare("SELECT facility_id FROM blood_banks LIMIT 1").get();
} catch (e) {
  try {
    db.exec('DROP TABLE IF EXISTS blood_banks');
  } catch (err) {}
}

// Initialize schema on load
db.exec(SCHEMA);

// Safely migrate orders table to add billing columns if not present
try {
  db.exec('ALTER TABLE orders ADD COLUMN discount REAL');
} catch (e) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN delivery_fee REAL');
} catch (e) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN tax REAL');
} catch (e) {}

// Unified Entity "Healthcare Request" fields
try {
  db.exec("ALTER TABLE orders ADD COLUMN request_source TEXT DEFAULT 'Patient'");
} catch (e) {}
try {
  db.exec("ALTER TABLE orders ADD COLUMN request_type TEXT DEFAULT 'Medicine'");
} catch (e) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN facility_id TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN blood_group TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN blood_units INTEGER');
} catch (e) {}

// Migrate patients table to add settings columns if not present
try {
  db.exec('ALTER TABLE patients ADD COLUMN email TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE patients ADD COLUMN address_line TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE patients ADD COLUMN city TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE patients ADD COLUMN zip_code TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE patients ADD COLUMN sms_notify INTEGER DEFAULT 1');
} catch (e) {}
try {
  db.exec('ALTER TABLE patients ADD COLUMN email_notify INTEGER DEFAULT 0');
} catch (e) {}
try {
  db.exec("ALTER TABLE patients ADD COLUMN language TEXT DEFAULT 'en'");
} catch (e) {}
try {
  db.exec('ALTER TABLE patients ADD COLUMN consent_active INTEGER DEFAULT 1');
} catch (e) {}
try {
  db.exec('ALTER TABLE patients ADD COLUMN profile_photo TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN return_reason TEXT');
} catch (e) {}
try {
  db.exec("UPDATE orders SET ece_level = 5 WHERE ece_level = 0 OR ece_level IS NULL");
} catch (e) {}

// Ensure notifications table is created
try {
  db.exec("DROP TABLE IF EXISTS notifications;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      recipient_role TEXT NOT NULL,
      recipient_id TEXT,
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      read INTEGER DEFAULT 0
    )
  `);
} catch (e) {}

// Seed standard blood bank categories if empty
const bloodGroupsList = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
for (const bg of bloodGroupsList) {
  try {
    db.prepare("INSERT OR IGNORE INTO blood_banks (blood_group, quantity, expiry) VALUES (?, ?, ?)").run(
      bg,
      Math.floor(12 + Math.random() * 24),
      '2026-09-30'
    );
  } catch (e) {}
}

// Seed Lisinopril if missing
try {
  db.prepare(`
    INSERT OR IGNORE INTO medicines (id, name, category, description, dosage, price, stock, prescription_required, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'MED-005',
    'Lisinopril',
    'Cardiovascular',
    'Angiotensin-Converting Enzyme (ACE) inhibitor for high blood pressure and cardiac support.',
    '10mg Daily',
    18.50,
    90,
    1,
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150'
  );
} catch (e) {}

export { db };
export default db;
