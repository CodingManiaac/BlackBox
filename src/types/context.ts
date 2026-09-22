import { DecisionTraceStep, RiskLevel, HumanReviewStatus, ExplainabilityReport } from './explainability';

export interface AgentOutput {
  agentId: string;
  timestamp: number;
  output: Record<string, any>;
  confidence: number;
  tokensUsed?: number;
  latencyMs?: number;
}

export interface ExecutionTimelineEntry {
  timestamp: number;
  stepName: string;
  status: 'STARTED' | 'FINISHED' | 'FAILED' | 'RETRY' | 'WARNING';
  message: string;
}

export interface RequestContext {
  readonly requestId: string;
  readonly patientId: string;
  readonly timestamp: number;
  readonly query: string;
  readonly workflowStage: string;
  readonly overallConfidence: number;
  readonly status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  readonly metadata: Record<string, any>;
  readonly agentOutputs: readonly AgentOutput[];
  readonly executionTimeline: readonly ExecutionTimelineEntry[];
  readonly systemWarnings: readonly string[];
  readonly requestType?: string;
  readonly requestSource?: string;

  // Explainable AI Enrichments (Phase 11)
  readonly decisionTrace?: readonly DecisionTraceStep[];
  readonly riskLevel?: RiskLevel;
  readonly humanReviewStatus?: HumanReviewStatus;
  readonly confidenceBreakdown?: Record<string, number>;
  readonly explainabilityReport?: ExplainabilityReport;
}
