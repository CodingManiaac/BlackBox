import { FacilityRepository, FacilityRecord } from '../repositories/FacilityRepository';

export class PharmacyService {
  static getPharmacyProfile(id: string): FacilityRecord {
    const facility = FacilityRepository.getById(id);
    if (!facility || facility.type !== 'Pharmacy') {
      throw new Error(`Pharmacy with ID ${id} not found.`);
    }
    return facility;
  }

  static getNearbyPharmacies(): FacilityRecord[] {
    return FacilityRepository.listByType('Pharmacy');
  }
}
export default PharmacyService;
