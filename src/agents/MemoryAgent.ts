import { BaseAgent } from './BaseAgent';
import { RequestContext } from '../types/context';
import { MemoryService } from '../services/MemoryService';

export class MemoryAgent extends BaseAgent {
  async execute(context: RequestContext): Promise<RequestContext> {
    const start = Date.now();
    
    // Retrieve patient history memories
    const memory = await MemoryService.getPatientMemorySummary(context.patientId);

    const warnings: string[] = [];

    // Duplicate refill check
    const queryLower = context.query.toLowerCase();
    if (queryLower.includes('insulin') && memory.context.previousRefillsCount > 0) {
      warnings.push(`Duplicate Refill Warning: Patient has refilled Insulin ${memory.context.previousRefillsCount} times recently.`);
    }

    // Allergy check
    if (memory.context.allergies.includes('Penicillin') && (queryLower.includes('penicillin') || queryLower.includes('amoxicillin'))) {
      warnings.push('Allergy Threat Warning: Patient is allergic to Penicillin! Suggest generic alternative.');
    }

    const memoryOutput = {
      summary: memory.summary,
      chronicDiseases: memory.context.chronicDiseases,
      allergies: memory.context.allergies,
      preferredHospital: memory.context.preferredHospital,
      previousRefillsCount: memory.context.previousRefillsCount,
      warnings,
      provider: memory.provider,
      confidence: 96.0
    };

    const nextContext: RequestContext = {
      ...context,
      systemWarnings: [...context.systemWarnings, ...warnings],
      agentOutputs: [...context.agentOutputs, {
        agentId: this.id,
        timestamp: Date.now(),
        output: memoryOutput,
        confidence: 96.0,
        latencyMs: Date.now() - start
      }],
      executionTimeline: [...context.executionTimeline, {
        timestamp: Date.now(),
        stepName: this.name,
        status: 'FINISHED',
        message: `Supermemory context loaded. Chronic: [${memory.context.chronicDiseases.join(', ')}]. Warnings: ${warnings.length}.`
      }]
    };

    return nextContext;
  }
}
export default MemoryAgent;
