import { FacilityRepository, FacilityRecord } from '../repositories/FacilityRepository';

export class HospitalService {
  static getHospitalProfile(id: string): FacilityRecord {
    const facility = FacilityRepository.getById(id);
    if (!facility || facility.type !== 'Hospital') {
      throw new Error(`Hospital with ID ${id} not found.`);
    }
    return facility;
  }

  static getActiveHospitals(): FacilityRecord[] {
    return FacilityRepository.listByType('Hospital');
  }
}
export default HospitalService;
