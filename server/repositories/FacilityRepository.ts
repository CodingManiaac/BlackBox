import { db } from '../database/db';

export interface FacilityRecord {
  id: string;
  name: string;
  address: string;
  coordinates: string;
  license_number: string;
  availability: string;
  status: string;
  type: 'Pharmacy' | 'Hospital' | 'BloodBank';
}

export class FacilityRepository {
  static getById(id: string): FacilityRecord | undefined {
    return db.prepare('SELECT * FROM facilities WHERE id = ?').get(id) as FacilityRecord | undefined;
  }

  static getByName(name: string): FacilityRecord | undefined {
    return db.prepare('SELECT * FROM facilities WHERE name = ?').get(name) as FacilityRecord | undefined;
  }

  static listByType(type: 'Pharmacy' | 'Hospital' | 'BloodBank'): FacilityRecord[] {
    return db.prepare('SELECT * FROM facilities WHERE type = ?').all(type) as FacilityRecord[];
  }

  static listAll(): FacilityRecord[] {
    return db.prepare('SELECT * FROM facilities').all() as FacilityRecord[];
  }
}
export default FacilityRepository;
