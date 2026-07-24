import { RequestContext } from '../types/context';
import { RiskLevel } from '../types/explainability';

export class RiskAnalyzer {
  static analyze(context: RequestContext): RiskLevel {
    const eceOutput = context.agentOutputs.find(out => out.agentId === 'ece')?.output;
    const inventoryOutput = context.agentOutputs.find(out => out.agentId === 'inventory')?.output;
    const logisticsOutput = context.agentOutputs.find(out => out.agentId === 'logistics')?.output;

    const eceLevel = eceOutput ? eceOutput.eceLevel : 5;
    const stockAvailable = inventoryOutput ? inventoryOutput.available : true;
    
    let etaMins = 0;
    if (logisticsOutput) {
      const etaMatch = logisticsOutput.eta.match(/\d+/);
      if (etaMatch) {
        etaMins = parseInt(etaMatch[0]);
      }
    }

    // Criticality check triggers
    if (eceLevel === 1) return 'CRITICAL';
    if (eceLevel === 2) return 'HIGH';
    if (!stockAvailable) return 'HIGH';
    if (eceLevel === 3 && etaMins > 15) return 'HIGH';
    if (eceLevel === 3) return 'MEDIUM';
    if (eceLevel === 4) return 'LOW';
    
    return 'LOW';
  }
}
export default RiskAnalyzer;
