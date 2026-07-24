import { AgentOutput } from '../types/context';
import { DecisionTraceStep } from '../types/explainability';

export class DecisionTrace {
  static build(outputs: readonly AgentOutput[]): DecisionTraceStep[] {
    return outputs.map(output => {
      let reason = 'Agent completed successfully.';
      
      // Extract specific reasons from inner outputs if available
      if (output.output && typeof output.output.reason === 'string') {
        reason = output.output.reason;
      } else if (output.output && typeof output.output.details === 'string') {
        reason = output.output.details;
      }

      return {
        timestamp: output.timestamp,
        agentId: output.agentId,
        confidence: output.confidence,
        reason: reason
      };
    });
  }
}
export default DecisionTrace;
