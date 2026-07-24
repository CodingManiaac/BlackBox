import { BaseAgent } from './BaseAgent';
import { RequestContext } from '../types/context';
import { AIService } from '../services/AIService';

export class GeminiAgent extends BaseAgent {
  async execute(context: RequestContext): Promise<RequestContext> {
    const start = Date.now();
    const mode = context.metadata?.mode || 'Mock';
    const aiResponse = await AIService.extractClinicalAttributes(context.query, mode);

    const nextContext: RequestContext = {
      ...context,
      agentOutputs: [...context.agentOutputs, {
        agentId: this.id,
        timestamp: Date.now(),
        output: {
          symptoms: aiResponse.symptoms,
          medicineIntent: aiResponse.medicineIntent || aiResponse.medicines || [],
          urgency: aiResponse.urgency,
          age: aiResponse.age || null,
          bloodGroup: aiResponse.bloodGroup || '',
          allergies: aiResponse.allergies || [],
          confidence: Math.round(aiResponse.confidence * 100),
          reason: `Gemini NLU parsed intent correctly. Urgency classification: ${aiResponse.urgency}.`
        },
        confidence: Math.round(aiResponse.confidence * 100),
        latencyMs: Date.now() - start
      }],
      executionTimeline: [...context.executionTimeline, {
        timestamp: Date.now(),
        stepName: this.name,
        status: 'FINISHED',
        message: `Gemini extracted: ${aiResponse.symptoms.length} symptoms, intent: [${(aiResponse.medicineIntent || aiResponse.medicines || []).join(', ')}].`
      }]
    };

    return nextContext;
  }
}
export default GeminiAgent;
