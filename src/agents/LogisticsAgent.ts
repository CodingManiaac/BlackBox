import { BaseAgent } from './BaseAgent';
import { RequestContext } from '../types/context';

export class LogisticsAgent extends BaseAgent {
  async execute(context: RequestContext): Promise<RequestContext> {
    const start = Date.now();
    
    const eceOutput = context.agentOutputs.find(out => out.agentId === 'ece')?.output;
    const gisOutput = context.agentOutputs.find(out => out.agentId === 'gis')?.output;
    const inventoryOutput = context.agentOutputs.find(out => out.agentId === 'inventory')?.output;
    
    let mode: 'Drone' | 'Ground Courier' | 'Ambulance' | 'Hospital Pickup' = 'Ground Courier';
    let priority: 'Low' | 'Medium' | 'High' | 'Immediate' = 'Medium';
    let baseEta = 15; // default mins
    
    if (gisOutput) {
      const etaMatch = gisOutput.eta.match(/\d+/);
      if (etaMatch) {
        baseEta = parseInt(etaMatch[0]);
      }
    }
    
    if (eceOutput) {
      const eceLevel = eceOutput.eceLevel;
      if (eceLevel === 1) {
        mode = 'Ambulance';
        priority = 'Immediate';
        baseEta = Math.max(2, Math.floor(baseEta * 0.4));
      } else if (eceLevel === 2) {
        mode = 'Drone';
        priority = 'High';
        baseEta = Math.max(3, Math.floor(baseEta * 0.5));
      } else if (eceLevel === 3) {
        if (inventoryOutput && inventoryOutput.coldChainRequired) {
          mode = 'Drone'; // Direct active quadcopter cooling pack flight
        } else {
          mode = 'Ground Courier';
        }
        priority = 'High';
      } else {
        mode = 'Ground Courier';
        priority = 'Low';
      }
    }

    const logisticsOutput = {
      deliveryMode: mode,
      eta: `${baseEta} mins`,
      priority: priority,
      confidence: 93.0
    };

    const nextContext: RequestContext = {
      ...context,
      agentOutputs: [...context.agentOutputs, {
        agentId: this.id,
        timestamp: Date.now(),
        output: logisticsOutput,
        confidence: 93.0,
        latencyMs: Date.now() - start
      }],
      executionTimeline: [...context.executionTimeline, {
        timestamp: Date.now(),
        stepName: this.name,
        status: 'FINISHED',
        message: `Logistics Mode: ${mode} (ETA: ${baseEta} mins).`
      }]
    };

    return nextContext;
  }
}
export default LogisticsAgent;
