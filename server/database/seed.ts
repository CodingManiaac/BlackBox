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
    INSERT OR REPLACE INTO blood_banks (facility_id, blood_group, quantity, expiry)
    VALUES (?, ?, ?, ?)
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
    ['PAT-006', 'Tony Stark', 48, 'Male', '+1-555-0808', 'A-', 'Heavy Metals', 'Heart Arrhythmia', 'Pepper Potts (+1-555-0809)'],
    ['HOSP-001', 'Metro General Hospital', 0, 'Institutional', '+1-555-9000', 'None', 'None', 'None', 'None']
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
    ['FAC-004', 'St. Jude Pediatrics Clinic', '512 St. Jude Way', '40.7850, -73.9680', 'LIC-HOSP-9903', '09:00 - 18:00', 'Active', 'Hospital'],

    // Pharmacies
    ['FAC-003', 'Care Pharmacy', '88 Lexington Ave', '40.7410, -73.9890', 'LIC-PHAR-8801', '08:00 - 22:00', 'Active', 'Pharmacy'],
    ['FAC-P01', 'Apollo Pharmacy', '124 Madison Ave', '40.7484, -73.9857', 'LIC-PHAR-8802', '24/7', 'Active', 'Pharmacy'],
    ['FAC-P02', 'MedPlus', '350 Fifth Ave', '40.7488, -73.9854', 'LIC-PHAR-8803', '08:00 - 23:00', 'Active', 'Pharmacy'],
    ['FAC-P03', 'Wellness Forever', '57 W 57th St', '40.7634, -73.9768', 'LIC-PHAR-8804', '24/7', 'Active', 'Pharmacy'],
    ['FAC-P04', 'City Pharmacy', '200 Park Ave', '40.7527, -73.9772', 'LIC-PHAR-8805', '09:00 - 21:00', 'Active', 'Pharmacy'],

    // Blood Banks
    ['FAC-005', 'Red Cross Blood Bank', '300 Central Park West', '40.7711, -73.9741', 'LIC-BB-7701', '24/7', 'Active', 'BloodBank'],
    ['FAC-B02', 'Government Blood Bank', '100 Water St', '40.7029, -74.0117', 'LIC-BB-7702', '24/7', 'Active', 'BloodBank'],
    ['FAC-B03', 'City Blood Centre', '111 Wall St', '40.7032, -74.0079', 'LIC-BB-7703', '24/7', 'Active', 'BloodBank'],
    ['FAC-B04', 'Apollo Blood Centre', '600 Third Ave', '40.7497, -73.9774', 'LIC-BB-7704', '24/7', 'Active', 'BloodBank'],
    ['FAC-B05', 'LifeCare Blood Bank', '750 Seventh Ave', '40.7607, -73.9839', 'LIC-BB-7705', '24/7', 'Active', 'BloodBank']
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

  // 4. Seed Blood Inventory across all 5 blood banks
  const bloodBanks = [
    // Red Cross Blood Bank (FAC-005)
    ['FAC-005', 'O-', 15, '2026-08-20'],
    ['FAC-005', 'O+', 30, '2026-08-25'],
    ['FAC-005', 'A+', 25, '2026-08-29'],
    ['FAC-005', 'B+', 20, '2026-09-02'],
    ['FAC-005', 'AB-', 5, '2026-09-05'],
    ['FAC-005', 'A-', 12, '2026-09-10'],
    ['FAC-005', 'B-', 10, '2026-09-15'],
    ['FAC-005', 'AB+', 8, '2026-09-20'],

    // Government Blood Bank (FAC-B02)
    ['FAC-B02', 'O-', 8, '2026-08-20'],
    ['FAC-B02', 'O+', 40, '2026-08-25'],
    ['FAC-B02', 'A+', 30, '2026-08-29'],
    ['FAC-B02', 'B+', 15, '2026-09-02'],
    ['FAC-B02', 'AB-', 3, '2026-09-05'],

    // City Blood Centre (FAC-B03)
    ['FAC-B03', 'O-', 2, '2026-08-20'],
    ['FAC-B03', 'O+', 15, '2026-08-25'],
    ['FAC-B03', 'A+', 10, '2026-08-29'],

    // Apollo Blood Centre (FAC-B04)
    ['FAC-B04', 'O-', 5, '2026-08-20'],
    ['FAC-B04', 'O+', 22, '2026-08-25'],

    // LifeCare Blood Bank (FAC-B05)
    ['FAC-B05', 'O-', 1, '2026-08-20'],
    ['FAC-B05', 'O+', 12, '2026-08-25']
  ];

  db.transaction(() => {
    for (const b of bloodBanks) {
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
    ['USR-002', 'pharmacy_demo', hashPassword('password'), 'Pharmacy', 'Care Pharmacy', 'FAC-003'],
    ['USR-003', 'hospital_demo', hashPassword('password'), 'Hospital', 'City Trauma Emergency Room', 'FAC-001'],
    ['USR-004', 'bloodbank_demo', hashPassword('password'), 'BloodBank', 'Red Cross Blood Bank', 'FAC-005'],
    ['USR-005', 'logistics_demo', hashPassword('password'), 'Logistics', 'Dave Miller', 'RD-001'],
    ['USR-006', 'admin_demo', hashPassword('password'), 'Admin', 'Chief Medical Officer', null],

    // Additional Pharmacies
    ['USR-P01', 'apollo_pharmacy', hashPassword('password'), 'Pharmacy', 'Apollo Pharmacy', 'FAC-P01'],
    ['USR-P02', 'medplus_pharmacy', hashPassword('password'), 'Pharmacy', 'MedPlus', 'FAC-P02'],
    ['USR-P03', 'wellness_pharmacy', hashPassword('password'), 'Pharmacy', 'Wellness Forever', 'FAC-P03'],
    ['USR-P04', 'city_pharmacy', hashPassword('password'), 'Pharmacy', 'City Pharmacy', 'FAC-P04'],

    // Additional Blood Banks
    ['USR-B02', 'gov_bloodbank', hashPassword('password'), 'BloodBank', 'Government Blood Bank', 'FAC-B02'],
    ['USR-B03', 'city_bloodbank', hashPassword('password'), 'BloodBank', 'City Blood Centre', 'FAC-B03'],
    ['USR-B04', 'apollo_bloodbank', hashPassword('password'), 'BloodBank', 'Apollo Blood Centre', 'FAC-B04'],
    ['USR-B05', 'lifecare_bloodbank', hashPassword('password'), 'BloodBank', 'LifeCare Blood Bank', 'FAC-B05']
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

  // 10. Seed Prescription Verifications
  const insertVerification = db.prepare(`
    INSERT OR REPLACE INTO prescription_verifications (id, patient_name, patient_allergies, doctor_name, prescribed_drug, date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const verifications = [
    ['RXV-9920', 'A. Sterling', 'Penicillin, Peanuts', 'Dr. Sarah Jenkins', 'Amoxicillin 500mg (21 tabs)', '11:15 AM', 'Awaiting Audit', ''],
    ['RXV-1102', 'G. Henderson', 'Sulfa Drugs', 'Dr. R. Gupta', 'Metformin 500mg (60 tabs)', '11:02 AM', 'Awaiting Audit', ''],
    ['RXV-4399', 'M. Vance', '', 'Dr. Sarah Jenkins', 'Lisinopril 10mg (30 tabs)', '10:45 AM', 'Awaiting Audit', '']
  ];

  db.transaction(() => {
    for (const v of verifications) {
      insertVerification.run(v);
    }
  })();

  // 11. Seed Hospital Stats
  const insertHospitalStats = db.prepare(`
    INSERT OR REPLACE INTO hospital_stats (facility_id, icu_occupied, icu_total, ventilator_occupied, ventilator_total)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertHospitalStats.run('FAC-001', 16, 20, 8, 12);

  // 12. Seed AI Configurations
  const insertAIConfig = db.prepare(`
    INSERT OR REPLACE INTO ai_configurations (key, value)
    VALUES (?, ?)
  `);
  insertAIConfig.run('active_model', 'Gemini 1.5 Pro');
  insertAIConfig.run('confidence_threshold', '85');
  insertAIConfig.run('triage_prompt', 'You are a clinical triage agent. Evaluate patient symptoms and extract severity levels from ECE-1 to ECE-5.');
  insertAIConfig.run('gis_prompt', 'Optimize transport coordinates routing. Verify hospital and blood bank locations within delivery boundaries.');

  // 13. Seed Drones
  const insertDrone = db.prepare(`
    INSERT OR REPLACE INTO drones (id, battery, status)
    VALUES (?, ?, ?)
  `);
  const drones = [
    ['D-01', 95, 'Idle'],
    ['D-02', 18, 'Charging'],
    ['D-03', 85, 'Active'],
    ['D-04', 70, 'Active'],
    ['D-05', 15, 'Needs Attention']
  ];
  db.transaction(() => {
    for (const d of drones) {
      insertDrone.run(d);
    }
  })();

  console.log('[Database] Seed executed successfully.');
}

// Support executing seed directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase();
}
export default seedDatabase;
