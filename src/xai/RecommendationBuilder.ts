import { RequestContext } from '../types/context';

export class RecommendationBuilder {
  static buildTechnical(context: RequestContext): string {
    const eceOutput = context.agentOutputs.find(out => out.agentId === 'ece')?.output;
    const gisOutput = context.agentOutputs.find(out => out.agentId === 'gis')?.output;
    const inventoryOutput = context.agentOutputs.find(out => out.agentId === 'inventory')?.output;
    const logisticsOutput = context.agentOutputs.find(out => out.agentId === 'logistics')?.output;
    const decisionOutput = context.agentOutputs.find(out => out.agentId === 'decision')?.output;

    const eceLevel = eceOutput ? eceOutput.eceLevel : 'N/A';
    const facilityName = gisOutput ? gisOutput.facility : 'nearest depot';
    const eta = logisticsOutput ? logisticsOutput.eta : 'N/A';
    const mode = logisticsOutput ? logisticsOutput.deliveryMode : 'Courier';
    const stockMsg = inventoryOutput && inventoryOutput.available ? 'in stock' : 'out of stock/unavailable';

    return `The system processed the patient request. Emergency Criticality assigned: ECE-${eceLevel} because: "${eceOutput?.reason || 'symptom rules matched'}" Nearest routed facility: ${facilityName} (ETA: ${eta}). Inventory check: item is ${stockMsg}. Transport mode selected: ${mode}. Recommendation: "${decisionOutput?.decision || 'Standard routing'}".`;
  }

  static buildPatientFriendly(context: RequestContext): string {
    const triageOutput = context.agentOutputs.find(out => out.agentId === 'triage')?.output;
    const eceOutput = context.agentOutputs.find(out => out.agentId === 'ece')?.output;
    const gisOutput = context.agentOutputs.find(out => out.agentId === 'gis')?.output;
    const logisticsOutput = context.agentOutputs.find(out => out.agentId === 'logistics')?.output;

    const eceLevel = eceOutput ? eceOutput.eceLevel : 5;
    const facilityName = gisOutput ? gisOutput.facility : 'the nearest center';
    const eta = logisticsOutput ? logisticsOutput.eta : 'a few minutes';
    const mode = logisticsOutput ? logisticsOutput.deliveryMode : 'courier';

    let header = 'We have processed your request.';
    if (eceLevel === 1) {
      header = '⚠️ We have flagged your case as an immediate emergency priority.';
    } else if (eceLevel === 2) {
      header = '🚨 Your request has been marked as high priority.';
    }

    const symptomsMsg = triageOutput && triageOutput.symptoms.length > 0 
      ? `because you reported symptoms of **${triageOutput.symptoms.join(' & ')}**`
      : 'to ensure you receive rapid medical supplies';

    let actionMsg = `We are dispatching a standard ${mode} to deliver your supplies from ${facilityName}. Estimated arrival time: **${eta}**.`;
    if (eceLevel === 1) {
      actionMsg = `An emergency **Ambulance** has been routed immediately to transport you to **${facilityName}**. Estimated arrival: **${eta}**. Please prepare for medical assistance.`;
    } else if (eceLevel === 2) {
      actionMsg = `We are flying an autonomous **Delivery Drone** directly to your location with your supplies from **${facilityName}** to bypass traffic delays. Estimated arrival: **${eta}**.`;
    }

    return `${header} ${actionMsg} This decision was made ${symptomsMsg}. Please stay calm and look out for your delivery.`;
  }
}
export default RecommendationBuilder;
