import { RequestContext } from '../types/context';
import { ExplainabilityReport } from '../types/explainability';
import { DecisionTrace } from './DecisionTrace';
import { ConfidenceAnalyzer } from './ConfidenceAnalyzer';
import { RecommendationBuilder } from './RecommendationBuilder';
import { RiskAnalyzer } from './RiskAnalyzer';
import { HumanReviewEngine } from './HumanReviewEngine';
import { apiKeys } from '../config/apiKeys';
import { GeminiProvider } from '../integrations/GeminiProvider';

export class ExplainabilityEngine {
  static async generateReport(context: RequestContext): Promise<RequestContext> {
    const triageOutput = context.agentOutputs.find(out => out.agentId === 'triage')?.output;
    const eceOutput = context.agentOutputs.find(out => out.agentId === 'ece')?.output;
    const gisOutput = context.agentOutputs.find(out => out.agentId === 'gis')?.output;
    const inventoryOutput = context.agentOutputs.find(out => out.agentId === 'inventory')?.output;
    const logisticsOutput = context.agentOutputs.find(out => out.agentId === 'logistics')?.output;

    const trace = DecisionTrace.build(context.agentOutputs);
    const breakdown = ConfidenceAnalyzer.analyze(context.agentOutputs);
    const risk = RiskAnalyzer.analyze(context);
    const review = HumanReviewEngine.evaluate(context);
    
    let techRec = RecommendationBuilder.buildTechnical(context);
    let patientFriendly = RecommendationBuilder.buildPatientFriendly(context);

    const mode = context.metadata?.mode || 'Mock';
    if (mode === 'Production' && apiKeys.gemini) {
      try {
        const promptTech = `Generate a technical clinical explainability report for the following context:
${JSON.stringify(context.agentOutputs, null, 2)}
Provide a brief, professional summary of the decision path, severity level, facility coordinates routing, and courier dispatch. Keep it under 3-4 sentences.`;

        const promptPatient = `Generate a warm, reassuring, and patient-friendly explanation of the clinical triage decision for the patient.
Use simple, non-jargon language. Do not show raw JSON. Here is the context:
${JSON.stringify(context.agentOutputs, null, 2)}
Keep it under 3 sentences.`;

        techRec = await GeminiProvider.generateContent(promptTech, 'text');
        patientFriendly = await GeminiProvider.generateContent(promptPatient, 'text');
      } catch (err) {
        console.warn('Gemini explainability generation failed, falling back to templates.', err);
      }
    }

    const report: ExplainabilityReport = {
      requestText: context.query,
      symptoms: triageOutput ? triageOutput.symptoms : [],
      emergencyLevel: eceOutput ? `ECE-${eceOutput.eceLevel}` : 'ECE-5',
      facilityName: gisOutput ? gisOutput.facility : 'nearest center',
      eta: logisticsOutput ? logisticsOutput.eta : 'N/A',
      inventoryStatus: inventoryOutput && inventoryOutput.available ? 'In Stock' : 'Out of Stock',
      deliveryMode: logisticsOutput ? logisticsOutput.deliveryMode : 'Ground Courier',
      overallConfidence: context.overallConfidence,
      confidenceBreakdown: breakdown,
      riskLevel: risk,
      requiresReview: review.requiresReview,
      humanReviewReason: review.reason,
      finalRecommendation: techRec,
      patientFriendlyExplanation: patientFriendly
    };

    return {
      ...context,
      decisionTrace: trace,
      riskLevel: risk,
      humanReviewStatus: review,
      confidenceBreakdown: breakdown,
      explainabilityReport: report
    };
  }
}
export default ExplainabilityEngine;
