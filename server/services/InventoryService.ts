import { InventoryRepository, MedicineInventory, BloodInventory } from '../repositories/InventoryRepository';

export class InventoryService {
  static checkAvailability(item: string, qty: number): boolean {
    const med = InventoryRepository.getMedicine(item);
    if (med) {
      return med.quantity >= qty;
    }
    const blood = InventoryRepository.getBlood(item);
    if (blood) {
      return blood.quantity >= qty;
    }
    return false;
  }

  static getMedicines(): MedicineInventory[] {
    return InventoryRepository.listMedicines();
  }

  static getBloodInventory(): BloodInventory[] {
    return InventoryRepository.listBlood();
  }
}
export default InventoryService;
