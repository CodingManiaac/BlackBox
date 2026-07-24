import { db } from './db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function seedDatabase() {
  const insertPatient = db.prepare(`
    INSERT OR REPLACE INTO patients (id, name, age, gender, phone, blood_group, allergies, medical_history, emergency_contacts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFacility = db.prepare(`
    INSERT OR REPLACE INTO facilities (id, name, address, coordinates, license_number, availability, status, type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInventory = db.prepare(`
    INSERT OR REPLACE INTO inventory (medicine, quantity, expiry, cold_chain_flag, alternatives)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertBloodBank = db.prepare(`
    INSERT OR REPLACE INTO blood_banks (blood_group, quantity, expiry)
    VALUES (?, ?, ?)
  `);

  const insertRider = db.prepare(`
    INSERT OR REPLACE INTO riders (id, name, status, current_location)
    VALUES (?, ?, ?, ?)
  `);

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, username, password_hash, role, name, associated_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMedicine = db.prepare(`
    INSERT OR REPLACE INTO medicines (id, name, category, description, dosage, price, stock, prescription_required, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAddress = db.prepare(`
    INSERT OR REPLACE INTO patient_addresses (id, patient_id, name, address_line, city, zip_code, phone, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Seed Patients
  const patients = [
    ['PAT-001', 'John Doe', 54, 'Male', '+1-555-0198', 'A+', 'Penicillin', 'Hypertension, Cardiac history', 'Jane Doe (+1-555-0199)'],
    ['PAT-002', 'Sarah Connor', 34, 'Female', '+1-555-0210', 'O-', 'None', 'Diabetic Type-1', 'John Connor (+1-555-0211)'],
    ['PAT-003', 'Bruce Wayne', 42, 'Male', '+1-555-0322', 'AB-', 'Sulfa', 'Fractures, Tachycardia', 'Alfred Pennyworth (+1-555-0323)'],
    ['PAT-004', 'Mary Jane', 8, 'Female', '+1-555-0450', 'B+', 'Peanuts', 'Asthma', 'Peter Parker (+1-555-0451)'],
    ['PAT-005', 'Clark Kent', 29, 'Male', '+1-555-0909', 'O+', 'None', 'None', 'Martha Kent (+1-555-0910)'],
    ['PAT-006', 'Tony Stark', 48, 'Male', '+1-555-0808', 'A-', 'Heavy Metals', 'Heart Arrhythmia', 'Pepper Potts (+1-555-0809)']
  ];

  db.transaction(() => {
    for (const p of patients) {
      insertPatient.run(p);
    }
  })();

  // 2. Seed Facilities
  const facilities = [
    ['FAC-001', 'City Trauma Emergency Room', '452 Broadway Ave', '40.7128, -74.0060', 'LIC-HOSP-9901', '24/7', 'Active', 'Hospital'],
    ['FAC-002', 'Metro General Hospital', '1012 Metro Blvd', '40.7589, -73.9851', 'LIC-HOSP-9902', '24/7', 'Active', 'Hospital'],
    ['FAC-003', 'Care Pharmacy Store', '88 Lexington Ave', '40.7410, -73.9890', 'LIC-PHAR-8801', '08:00 - 22:00', 'Active', 'Pharmacy'],
    ['FAC-004', 'St. Jude Pediatrics Clinic', '512 St. Jude Way', '40.7850, -73.9680', 'LIC-HOSP-9903', '09:00 - 18:00', 'Active', 'Hospital'],
    ['FAC-005', 'Central Red Cross Blood Bank', '300 Central Park West', '40.7711, -73.9741', 'LIC-BB-7701', '24/7', 'Active', 'BloodBank']
  ];

  db.transaction(() => {
    for (const f of facilities) {
      insertFacility.run(f);
    }
  })();

  // 3. Seed Medicine Inventory
  const medicines = [
    ['Insulin', 25, '2027-12-01', 1, 'Humalog, Novolog, Actrapid'],
    ['Atorvastatin', 140, '2028-06-15', 0, 'Lipitor, Rosuvastatin'],
    ['Amoxicillin', 120, '2027-09-10', 0, 'Penicillin, Cephalexin'],
    ['Metformin', 200, '2028-02-20', 0, 'Glucophage, Glipizide']
  ];

  db.transaction(() => {
    for (const m of medicines) {
      insertInventory.run(m);
    }
  })();

  // 4. Seed Blood Inventory
  const bloodGroups = [
    ['O-', 6, '2026-08-20'],
    ['A+', 22, '2026-08-25'],
    ['B+', 14, '2026-08-29'],
    ['AB-', 4, '2026-09-02']
  ];

  db.transaction(() => {
    for (const b of bloodGroups) {
      insertBloodBank.run(b);
    }
  })();

  // 5. Seed Riders
  const riders = [
    ['RD-001', 'Dave Miller', 'Idle', '40.7130, -74.0065'],
    ['RD-002', 'Sarah Jenkins', 'Active', '40.7420, -73.9895'],
    ['RD-003', 'Alex Rodriguez', 'Idle', '40.7720, -73.9750']
  ];

  db.transaction(() => {
    for (const r of riders) {
      insertRider.run(r);
    }
  })();

  // 6. Seed Demo Users
  const demoUsers = [
    ['USR-001', 'patient_demo', hashPassword('password'), 'Patient', 'John Doe', 'PAT-001'],
    ['USR-002', 'pharmacy_demo', hashPassword('password'), 'Pharmacy', 'Care Pharmacy Store', 'FAC-003'],
    ['USR-003', 'hospital_demo', hashPassword('password'), 'Hospital', 'City Trauma Emergency Room', 'FAC-001'],
    ['USR-004', 'bloodbank_demo', hashPassword('password'), 'BloodBank', 'Central Red Cross Blood Bank', 'FAC-005'],
    ['USR-005', 'logistics_demo', hashPassword('password'), 'Logistics', 'Dave Miller', 'RD-001'],
    ['USR-006', 'admin_demo', hashPassword('password'), 'Admin', 'Chief Medical Officer', null]
  ];

  db.transaction(() => {
    for (const u of demoUsers) {
      insertUser.run(u);
    }
  })();

  // 7. Seed Medicines Catalog
  const catalogue = [
    ['MED-001', 'Atorvastatin', 'Cardiovascular', 'Manages cholesterol levels and lowers heart risk.', '20mg once daily in evening', 12.50, 100, 1, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop'],
    ['MED-002', 'Metformin', 'Diabetes', 'First-line medication for Type-2 Diabetes glucose control.', '500mg twice daily with meals', 8.90, 200, 1, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop'],
    ['MED-003', 'Amoxicillin', 'Antibiotics', 'Broad-spectrum antibiotic to treat various bacterial infections.', '500mg three times daily', 15.00, 150, 1, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop'],
    ['MED-004', 'Insulin Glargine', 'Diabetes', 'Long-acting basal insulin injection for diabetes management.', '10 Units injected once daily', 45.00, 50, 1, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop'],
    ['MED-005', 'Paracetamol', 'Pain Relief', 'Everyday analgesic used to treat fever and mild-to-moderate pain.', '500mg every 4-6 hours as needed', 3.20, 500, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop'],
    ['MED-006', 'Ibuprofen', 'Pain Relief', 'Non-steroidal anti-inflammatory drug (NSAID) for muscle ache.', '400mg three times daily after food', 4.50, 300, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop'],
    ['MED-007', 'Cetirizine', 'Allergy Relief', 'Non-drowsy antihistamine for allergy symptoms and hay fever.', '10mg once daily', 6.00, 250, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop']
  ];

  db.transaction(() => {
    for (const m of catalogue) {
      insertMedicine.run(m);
    }
  })();

  // 8. Seed Patient Addresses
  const addresses = [
    ['ADD-001', 'PAT-001', 'John Doe (Home)', '128 Main St, Apt 4B', 'New York', '10001', '+1-555-0198', 1],
    ['ADD-002', 'PAT-001', 'John Doe (Office)', '405 Broadway Ave, FL 12', 'New York', '10013', '+1-555-0198', 0]
  ];

  db.transaction(() => {
    for (const a of addresses) {
      insertAddress.run(a);
    }
  })();

  // 9. Seed Categories
  const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO categories (id, name)
    VALUES (?, ?)
  `);

  const categories = [
    ['CAT-001', 'Cardiovascular'],
    ['CAT-002', 'Diabetes'],
    ['CAT-003', 'Antibiotics'],
    ['CAT-004', 'Pain Relief'],
    ['CAT-005', 'Allergy Relief']
  ];

  db.transaction(() => {
    for (const c of categories) {
      insertCategory.run(c);
    }
  })();

  console.log('[Database] Seed executed successfully.');
}

// Support executing seed directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase();
}
export default seedDatabase;
