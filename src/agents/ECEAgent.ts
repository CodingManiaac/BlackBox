import { BaseAgent } from './BaseAgent';
import { RequestContext } from '../types/context';
import emergencyRules from '../knowledge/emergencyRules.json';

export class ECEAgent extends BaseAgent {
  async execute(context: RequestContext): Promise<RequestContext> {
    const start = Date.now();
    const triageOutput = context.agentOutputs.find(out => out.agentId === 'triage')?.output;
    
    let eceLevel = 5; // Default lowest severity
    let matchedReason = 'No critical emergency symptoms detected.';
    let matchedPriority = 'Routine';
    
    if (triageOutput) {
      const symptoms = triageOutput.symptoms as string[];
      
      for (const rule of emergencyRules.rules) {
        if (symptoms.includes(rule.trigger)) {
          if (rule.eceLevel < eceLevel) {
            eceLevel = rule.eceLevel;
            matchedReason = rule.reason;
            matchedPriority = rule.priority;
          }
        }
      }
      
      // Secondary check: Fever combined with respiratory distress upgrades case to immediate ECE-1
      const queryLower = context.query.toLowerCase();
      if (queryLower.includes('fever') && (queryLower.includes('breathe') || queryLower.includes('breathing') || queryLower.includes('breath'))) {
        eceLevel = 1;
        matchedReason = 'High fever combined with acute breathing difficulty indicates respiratory threat. Elevating to ECE-1.';
        matchedPriority = 'Immediate Life Threat';
      }
    }

    const eceOutput = {
      eceLevel,
      priority: matchedPriority,
      reason: matchedReason,
      confidence: 96.0
    };

    const nextContext: RequestContext = {
      ...context,
      agentOutputs: [...context.agentOutputs, {
        agentId: this.id,
        timestamp: Date.now(),
        output: eceOutput,
        confidence: 96.0,
        latencyMs: Date.now() - start
      }],
      executionTimeline: [...context.executionTimeline, {
        timestamp: Date.now(),
        stepName: this.name,
        status: 'FINISHED',
        message: `Designated Criticality: ECE-${eceLevel} (${matchedPriority}).`
      }]
    };

    return nextContext;
  }
}
export default ECEAgent;
