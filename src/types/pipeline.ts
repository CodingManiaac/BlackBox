import { RequestContext } from './context';

export interface PipelineExecutionResult {
  requestId: string;
  finalContext: RequestContext;
  success: boolean;
  totalLatencyMs: number;
  stepsExecuted: string[];
}
