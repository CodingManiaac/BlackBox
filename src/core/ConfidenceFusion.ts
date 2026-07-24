import { AgentOutput } from '../types/context';
import { AgentRegistry } from './AgentRegistry';
import { LoggerService } from '../services/LoggerService';

export class ConfidenceFusion {
  static calculate(outputs: readonly AgentOutput[]): number {
    if (outputs.length === 0) return 1.0;

    let totalWeightedConfidence = 0;
    let totalWeight = 0;

    for (const output of outputs) {
      const config = AgentRegistry.getConfiguration(output.agentId);
      if (config) {
        totalWeightedConfidence += output.confidence * config.weight;
        totalWeight += config.weight;
      } else {
        // Fallback default weight if not registered in configurations
        totalWeightedConfidence += output.confidence * 0.1;
        totalWeight += 0.1;
      }
    }

    const overall = totalWeight > 0 ? totalWeightedConfidence / totalWeight : 1.0;
    
    // Round to two decimal places
    const score = Number(overall.toFixed(2));
    LoggerService.info(`Fused overall system confidence calculated at: ${score}%`, 'ConfidenceFusion');
    return score;
  }
}
export default ConfidenceFusion;
