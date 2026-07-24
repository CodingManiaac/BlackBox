import { PatientRepository, PatientRecord } from '../repositories/PatientRepository';

export class PatientService {
  static getPatientProfile(id: string): PatientRecord {
    const patient = PatientRepository.getById(id);
    if (!patient) {
      throw new Error(`Unknown patient ID: ${id}`);
    }
    return patient;
  }

  static registerPatient(patient: PatientRecord) {
    if (!patient.name || !patient.phone) {
      throw new Error('Invalid patient details provided.');
    }
    PatientRepository.create(patient);
  }

  static getAllPatients(): PatientRecord[] {
    return PatientRepository.list();
  }
}
export default PatientService;
