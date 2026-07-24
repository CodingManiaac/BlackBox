import { RequestContext } from '../types/context';
import { ExplainabilityReport } from '../types/explainability';
import { DecisionTrace } from './DecisionTrace';
import { ConfidenceAnalyzer } from './ConfidenceAnalyzer';
import { RecommendationBuilder } from './RecommendationBuilder';
import { RiskAnalyzer } from './RiskAnalyzer';
import { HumanReviewEngine } from './HumanReviewEngine';

export class ExplainabilityEngine {
  static generateReport(context: RequestContext): RequestContext {
    const triageOutput = context.agentOutputs.find(out => out.agentId === 'triage')?.output;
    const eceOutput = context.agentOutputs.find(out => out.agentId === 'ece')?.output;
    const gisOutput = context.agentOutputs.find(out => out.agentId === 'gis')?.output;
    const inventoryOutput = context.agentOutputs.find(out => out.agentId === 'inventory')?.output;
    const logisticsOutput = context.agentOutputs.find(out => out.agentId === 'logistics')?.output;

    const trace = DecisionTrace.build(context.agentOutputs);
    const breakdown = ConfidenceAnalyzer.analyze(context.agentOutputs);
    const risk = RiskAnalyzer.analyze(context);
    const review = HumanReviewEngine.evaluate(context);
    
    const techRec = RecommendationBuilder.buildTechnical(context);
    const patientFriendly = RecommendationBuilder.buildPatientFriendly(context);

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
