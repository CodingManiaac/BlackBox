export interface DecisionTraceStep {
  timestamp: number;
  agentId: string;
  confidence: number;
  reason: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface HumanReviewStatus {
  requiresReview: boolean;
  reason: string;
}

export interface ExplainabilityReport {
  requestText: string;
  symptoms: string[];
  emergencyLevel: string;
  facilityName: string;
  eta: string;
  inventoryStatus: string;
  deliveryMode: string;
  overallConfidence: number;
  confidenceBreakdown: Record<string, number>;
  riskLevel: RiskLevel;
  requiresReview: boolean;
  humanReviewReason: string;
  finalRecommendation: string;
  patientFriendlyExplanation: string;
}
