export const SCHEMA = `
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  allergies TEXT,
  medical_history TEXT,
  emergency_contacts TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  medicine TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  ece_level INTEGER NOT NULL,
  status TEXT NOT NULL,
  assigned_pharmacy TEXT,
  assigned_rider TEXT,
  eta TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  total_amount REAL,
  payment_status TEXT,
  payment_method TEXT,
  address_line TEXT,
  discount REAL,
  delivery_fee REAL,
  tax REAL,
  request_source TEXT DEFAULT 'Patient',
  request_type TEXT DEFAULT 'Medicine',
  facility_id TEXT,
  blood_group TEXT,
  blood_units INTEGER,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  coordinates TEXT NOT NULL,
  license_number TEXT NOT NULL,
  availability TEXT NOT NULL,
  status TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('Pharmacy', 'Hospital', 'BloodBank'))
);

CREATE TABLE IF NOT EXISTS blood_banks (
  blood_group TEXT PRIMARY KEY,
  quantity INTEGER NOT NULL,
  expiry TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  medicine TEXT PRIMARY KEY,
  quantity INTEGER NOT NULL,
  expiry TEXT NOT NULL,
  cold_chain_flag INTEGER NOT NULL CHECK(cold_chain_flag IN (0, 1)),
  alternatives TEXT
);

CREATE TABLE IF NOT EXISTS riders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  current_location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  request_id TEXT NOT NULL,
  agent_id TEXT,
  message TEXT NOT NULL,
  error TEXT
);

CREATE TABLE IF NOT EXISTS requests_context (
  request_id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  query TEXT NOT NULL,
  workflow_stage TEXT NOT NULL,
  overall_confidence REAL NOT NULL,
  status TEXT NOT NULL,
  context_json TEXT NOT NULL,
  trace_json TEXT,
  timeline_json TEXT,
  risk_level TEXT,
  human_review_json TEXT,
  confidence_breakdown_json TEXT,
  timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  associated_id TEXT
);

CREATE TABLE IF NOT EXISTS medicines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  dosage TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL,
  prescription_required INTEGER NOT NULL CHECK(prescription_required IN (0, 1)),
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS patient_addresses (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_default INTEGER NOT NULL CHECK(is_default IN (0, 1))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS cart (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  medicine_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  medicine_name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  read INTEGER DEFAULT 0
);
`;
