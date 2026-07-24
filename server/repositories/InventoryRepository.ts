import { db } from '../database/db';

export interface MedicineInventory {
  medicine: string;
  quantity: number;
  expiry: string;
  cold_chain_flag: number;
  alternatives?: string;
}

export interface BloodInventory {
  blood_group: string;
  quantity: number;
  expiry: string;
}

export class InventoryRepository {
  static getMedicine(name: string): MedicineInventory | undefined {
    return db.prepare('SELECT * FROM inventory WHERE LOWER(medicine) = LOWER(?)').get(name) as MedicineInventory | undefined;
  }

  static getBlood(group: string): BloodInventory | undefined {
    return db.prepare('SELECT * FROM blood_banks WHERE blood_group = ?').get(group) as BloodInventory | undefined;
  }

  static deductMedicine(name: string, quantity: number): boolean {
    const record = this.getMedicine(name);
    if (!record || record.quantity < quantity) return false;
    
    db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE LOWER(medicine) = LOWER(?)')
      .run(quantity, name);
    return true;
  }

  static deductBlood(group: string, quantity: number): boolean {
    const record = this.getBlood(group);
    if (!record || record.quantity < quantity) return false;

    db.prepare('UPDATE blood_banks SET quantity = quantity - ? WHERE blood_group = ?')
      .run(quantity, group);
    return true;
  }

  static listMedicines(): MedicineInventory[] {
    return db.prepare('SELECT * FROM inventory').all() as MedicineInventory[];
  }

  static listBlood(): BloodInventory[] {
    return db.prepare('SELECT * FROM blood_banks').all() as BloodInventory[];
  }
}
export default InventoryRepository;
