import { RequestContext } from '../types/context';
import { HumanReviewStatus } from '../types/explainability';

export class HumanReviewEngine {
  static evaluate(context: RequestContext): HumanReviewStatus {
    const eceOutput = context.agentOutputs.find(out => out.agentId === 'ece')?.output;
    const inventoryOutput = context.agentOutputs.find(out => out.agentId === 'inventory')?.output;
    const decisionOutput = context.agentOutputs.find(out => out.agentId === 'decision')?.output;

    const eceLevel = eceOutput ? eceOutput.eceLevel : 5;
    const stockAvailable = inventoryOutput ? inventoryOutput.available : true;
    const overallConfidence = decisionOutput ? decisionOutput.overallConfidence : 100;

    if (eceLevel <= 2) {
      return {
        requiresReview: true,
        reason: `Life-threatening emergency (ECE-${eceLevel}) requires immediate medical practitioner clearance.`
      };
    }

    if (!stockAvailable) {
      return {
        requiresReview: true,
        reason: 'Requested item is out of stock. Pharmacist verification needed to authorize generic alternatives.'
      };
    }

    if (overallConfidence < 70) {
      return {
        requiresReview: true,
        reason: `System overall confidence (${overallConfidence}%) falls below safety threshold. Manual routing required.`
      };
    }

    return {
      requiresReview: false,
      reason: 'Standard query conditions. Automated routing approved.'
    };
  }
}
export default HumanReviewEngine;
