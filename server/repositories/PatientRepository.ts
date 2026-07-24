import { db } from '../database/db';

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  blood_group: string;
  allergies?: string;
  medical_history?: string;
  emergency_contacts: string;
  email?: string;
  address_line?: string;
  city?: string;
  zip_code?: string;
  sms_notify?: number;
  email_notify?: number;
  language?: string;
  consent_active?: number;
}

export class PatientRepository {
  static getById(id: string): PatientRecord | undefined {
    return db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as PatientRecord | undefined;
  }

  static create(patient: PatientRecord) {
    db.prepare(`
      INSERT INTO patients (id, name, age, gender, phone, blood_group, allergies, medical_history, emergency_contacts, email, address_line, city, zip_code, sms_notify, email_notify, language, consent_active)
      VALUES (@id, @name, @age, @gender, @phone, @blood_group, @allergies, @medical_history, @emergency_contacts, @email, @address_line, @city, @zip_code, @sms_notify, @email_notify, @language, @consent_active)
    `).run({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      blood_group: patient.blood_group,
      allergies: patient.allergies || null,
      medical_history: patient.medical_history || null,
      emergency_contacts: patient.emergency_contacts,
      email: patient.email || null,
      address_line: patient.address_line || null,
      city: patient.city || null,
      zip_code: patient.zip_code || null,
      sms_notify: patient.sms_notify ?? 1,
      email_notify: patient.email_notify ?? 0,
      language: patient.language || 'en',
      consent_active: patient.consent_active ?? 1
    });
  }

  static updateSettings(id: string, settings: Partial<PatientRecord>) {
    db.prepare(`
      UPDATE patients
      SET name = ?, email = ?, address_line = ?, city = ?, zip_code = ?,
          emergency_contacts = ?, sms_notify = ?, email_notify = ?,
          language = ?, consent_active = ?, allergies = ?
      WHERE id = ?
    `).run(
      settings.name ?? '',
      settings.email ?? '',
      settings.address_line ?? '',
      settings.city ?? '',
      settings.zip_code ?? '',
      settings.emergency_contacts ?? '',
      settings.sms_notify ?? 1,
      settings.email_notify ?? 0,
      settings.language ?? 'en',
      settings.consent_active ?? 1,
      settings.allergies ?? '',
      id
    );
  }

  static list(limit = 20, offset = 0): PatientRecord[] {
    return db.prepare('SELECT * FROM patients LIMIT ? OFFSET ?').all(limit, offset) as PatientRecord[];
  }
}
export default PatientRepository;
