import { AgentOutput } from '../types/context';

export class ConfidenceAnalyzer {
  static analyze(outputs: readonly AgentOutput[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const output of outputs) {
      breakdown[output.agentId] = output.confidence;
    }
    return breakdown;
  }
}
export default ConfidenceAnalyzer;
