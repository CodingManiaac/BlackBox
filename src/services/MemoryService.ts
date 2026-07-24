import { SupermemoryProvider, PatientMemoryContext } from '../integrations/SupermemoryProvider';

export class MemoryService {
  static async getPatientMemorySummary(patientId: string): Promise<{
    summary: string;
    context: PatientMemoryContext;
    provider: 'Supermemory' | 'Database';
  }> {
    try {
      const context = await SupermemoryProvider.retrievePatientContext(patientId);
      const parts: string[] = [];
      
      if (context.chronicDiseases.length > 0) {
        parts.push(`Chronic conditions: ${context.chronicDiseases.join(', ')}`);
      }
      if (context.allergies.length > 0) {
        parts.push(`Known allergies: ${context.allergies.join(', ')}`);
      }
      if (context.previousRefillsCount > 0) {
        parts.push(`Previous refills count: ${context.previousRefillsCount}`);
      }

      const summary = parts.length > 0 ? parts.join('. ') : 'No prior chronic history recorded.';
      
      return {
        summary,
        context,
        provider: 'Supermemory'
      };
    } catch (err) {
      console.warn('[MemoryService] Failed, returning empty profile context...', err);
      const emptyContext: PatientMemoryContext = {
        chronicDiseases: [],
        allergies: [],
        previousRefillsCount: 0,
        preferredHospital: 'City Trauma Emergency Room'
      };
      return {
        summary: 'No prior clinical history retrieved.',
        context: emptyContext,
        provider: 'Database'
      };
    }
  }
}
export default MemoryService;
