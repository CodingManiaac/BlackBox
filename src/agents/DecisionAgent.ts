import { BaseAgent } from './BaseAgent';
import { RequestContext } from '../types/context';
import { ConfidenceFusion } from '../core/ConfidenceFusion';

export class DecisionAgent extends BaseAgent {
  async execute(context: RequestContext): Promise<RequestContext> {
    const start = Date.now();
    
    const eceOutput = context.agentOutputs.find(out => out.agentId === 'ece')?.output;
    const gisOutput = context.agentOutputs.find(out => out.agentId === 'gis')?.output;
    const inventoryOutput = context.agentOutputs.find(out => out.agentId === 'inventory')?.output;

    let recommendation = 'Awaiting further diagnostics.';
    let requiresHumanReview = false;
    const warnings: string[] = [];

    const eceLevel = eceOutput ? eceOutput.eceLevel : 5;
    const stockAvailable = inventoryOutput ? inventoryOutput.available : false;
    const itemName = inventoryOutput ? inventoryOutput.itemName : 'None';

    if (eceLevel <= 2) {
      requiresHumanReview = true;
      warnings.push(`High criticality ECE-${eceLevel} requires instant clinical practitioner authorization.`);
    }

    if (itemName !== 'None' && !stockAvailable) {
      requiresHumanReview = true;
      warnings.push(`Item "${itemName}" is currently OUT OF STOCK. Manual check for alternative generics suggested.`);
    }

    // Determine final clinical workflow action recommendation
    if (eceLevel === 1) {
      recommendation = `IMMEDIATE DISPATCH: Route emergency Ambulance to ${gisOutput?.facility || 'nearest ER'} with ${itemName}.`;
    } else if (eceLevel === 2) {
      recommendation = `PRIORITY FLIGHT: Dispatch transport Drone carrying ${itemName} to ${gisOutput?.facility || 'designated coord zone'}.`;
    } else if (stockAvailable) {
      recommendation = `DISPATCH APPROVED: Send Ground Courier delivering ${itemName} from ${gisOutput?.facility || 'inventory depot'}.`;
    } else {
      recommendation = `MANUAL ROUTING REQUIRED: Resolve supply options for query: "${context.query}".`;
    }

    // Fused confidence rating using ConfidenceFusion weighted algebra
    const finalConfidence = ConfidenceFusion.calculate(context.agentOutputs);

    const decisionOutput = {
      overallConfidence: finalConfidence,
      decision: recommendation,
      requiresHumanReview: requiresHumanReview,
      reason: `Consolidated ECE-${eceLevel} severity, geographical coordinates targets at ${gisOutput?.facility || 'Unknown'}, inventory checks, and shipping logistics.`,
      warnings: warnings,
      confidence: 99.0
    };

    const nextContext: RequestContext = {
      ...context,
      agentOutputs: [...context.agentOutputs, {
        agentId: this.id,
        timestamp: Date.now(),
        output: decisionOutput,
        confidence: 99.0,
        latencyMs: Date.now() - start
      }],
      executionTimeline: [...context.executionTimeline, {
        timestamp: Date.now(),
        stepName: this.name,
        status: 'FINISHED',
        message: `Decision determined: "${recommendation}" (Review required: ${requiresHumanReview}).`
      }]
    };

    return nextContext;
  }
}
export default DecisionAgent;
