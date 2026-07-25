import { BaseAgent } from './BaseAgent';
import { RequestContext } from '../types/context';
import { AIService } from '../services/AIService';

export class TriageAgent extends BaseAgent {
  async execute(context: RequestContext): Promise<RequestContext> {
    const start = Date.now();
    const queryLower = context.query.toLowerCase();
    
    const mode = context.metadata.mode || 'Mock';
    const aiResponse = await AIService.extractClinicalAttributes(context.query, mode);

    const extractedMedicines = aiResponse.medicines;
    const extractedSymptoms = aiResponse.symptoms;
    const detectedBlood = aiResponse.bloodGroup || null;
    const urgencyKeywords = aiResponse.urgencyKeywords || [];

    const triageOutput = {
      intent: queryLower.includes('need') || queryLower.includes('request') ? 'Supply Request' : 'Symptom Evaluation',
      medicines: extractedMedicines,
      symptoms: extractedSymptoms,
      urgencyKeywords: urgencyKeywords,
      detectedBloodGroup: detectedBlood,
      confidence: Math.round(aiResponse.confidence * 100),
      reason: aiResponse.reasoning || `Parsed clinical tokens (${aiResponse.parserMode} Mode): Symptoms: [${extractedSymptoms.join(', ')}], Meds: [${extractedMedicines.join(', ')}].`
    };

    const nextContext: RequestContext = {
      ...context,
      agentOutputs: [...context.agentOutputs, {
        agentId: this.id,
        timestamp: Date.now(),
        output: triageOutput,
        confidence: 95.0,
        latencyMs: Date.now() - start
      }],
      executionTimeline: [...context.executionTimeline, {
        timestamp: Date.now(),
        stepName: this.name,
        status: 'FINISHED',
        message: `Triage parsed symptoms: [${extractedSymptoms.join(', ')}].`
      }]
    };

    return nextContext;
  }
}
export default TriageAgent;
