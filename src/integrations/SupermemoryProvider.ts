import { apiKeys } from '../config/apiKeys';
import { getApiBaseUrl } from '../config/api';

export interface PatientMemoryContext {
  chronicDiseases: string[];
  allergies: string[];
  previousRefillsCount: number;
  lastEmergencyDate?: string;
  preferredHospital: string;
}

export class SupermemoryProvider {
  static async retrievePatientContext(patientId: string): Promise<PatientMemoryContext> {
    const key = apiKeys.supermemory;

    if (key) {
      try {
        const response = await fetch(`https://api.supermemory.ai/v1/memories?patientId=${patientId}`, {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        if (response.ok) {
          const data = await response.json();
          return {
            chronicDiseases: data.diseases || [],
            allergies: data.allergies || [],
            previousRefillsCount: data.refills || 0,
            preferredHospital: data.preferredHospital || 'City Trauma Emergency Room'
          };
        }
      } catch (err) {
        console.warn('[Supermemory] Fetch failed, falling back to database profiles...', err);
      }
    }

    // Standard database fallback values based on patient profiles
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/patients/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.patient) {
          const p = data.patient;
          const allergiesList = p.allergies ? p.allergies.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
          const chronicList = p.medical_history ? p.medical_history.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
          return {
            chronicDiseases: chronicList,
            allergies: allergiesList,
            previousRefillsCount: 2,
            preferredHospital: 'City Trauma Emergency Room'
          };
        }
      }
    } catch (e) {
      console.warn('[Supermemory] API database fallback failed', e);
    }

    return {
      chronicDiseases: [],
      allergies: [],
      previousRefillsCount: 0,
      preferredHospital: 'City Trauma Emergency Room'
    };
  }
}
export default SupermemoryProvider;
