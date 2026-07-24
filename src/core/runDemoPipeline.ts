import { AgentRegistry } from './AgentRegistry';
import { AgentFactory } from '../agents/AgentFactory';
import { MedXEngine } from './MedXEngine';
import { ExecutionLogger } from './ExecutionLogger';
import { agentsConfig } from '../config/agents';
import { LoggerService } from '../services/LoggerService';
import patientScenarios from '../knowledge/patientScenarios.json';

export async function runDemoPipeline() {
  LoggerService.info('========================================================', 'Demo');
  LoggerService.info('Initializing MedX AI Multi-Agent Orchestration Demo Run', 'Demo');
  LoggerService.info('========================================================', 'Demo');

  // Start pubsub console execution logger
  ExecutionLogger.startListening();

  // Dynamically register 8 clinical agents using factory creator
  const gemini = AgentFactory.create('gemini', 'Gemini NLU Agent', 'Natural Language Understanding', []);
  const triage = AgentFactory.create('triage', 'Triage Agent', 'Symptom NLP parsing', ['gemini']);
  const memory = AgentFactory.create('memory', 'Memory Agent (Supermemory)', 'Patient context memory retrieval', ['triage']);
  const ece = AgentFactory.create('ece', 'ECE Engine', 'Severity triage calculations', ['memory']);
  const gis = AgentFactory.create('gis', 'GIS Agent', 'Ambulance coordinate channels routing', ['ece']);
  const inventory = AgentFactory.create('inventory', 'Inventory Agent', 'Resource stock availability reservations', ['gis']);
  const logistics = AgentFactory.create('logistics', 'Logistics Agent', 'Rider/Drone courier dispatch coordinates', ['inventory']);
  const decision = AgentFactory.create('decision', 'Decision Engine', 'Clinical authentication confirmations', ['logistics']);

  AgentRegistry.clear();
  AgentRegistry.register(gemini, agentsConfig.gemini);
  AgentRegistry.register(triage, agentsConfig.triage);
  AgentRegistry.register(memory, agentsConfig.memory);
  AgentRegistry.register(ece, agentsConfig.ece);
  AgentRegistry.register(gis, agentsConfig.gis);
  AgentRegistry.register(inventory, agentsConfig.inventory);
  AgentRegistry.register(logistics, agentsConfig.logistics);
  AgentRegistry.register(decision, agentsConfig.decision);

  // Iterate and process each scenario
  for (const scenario of patientScenarios.scenarios) {
    LoggerService.info('--------------------------------------------------------', 'Demo');
    LoggerService.info(`Starting Scenario for Patient ID: ${scenario.patientId}`, 'Demo');
    LoggerService.info(`Query Input: "${scenario.query}"`, 'Demo');
    LoggerService.info('--------------------------------------------------------', 'Demo');

    // Execute orchestration pipeline
    const result = await MedXEngine.processRequest(scenario.patientId, scenario.query);


    LoggerService.info('================================================', 'Demo');
    LoggerService.info('             EXPLAINABILITY REPORT              ', 'Demo');
    LoggerService.info('================================================', 'Demo');
    
    const xaiReport = result.finalContext.explainabilityReport;
    if (xaiReport) {
      LoggerService.info(`Request: "${xaiReport.requestText}"`, 'Demo');
      LoggerService.info(`Detected Symptoms: [${xaiReport.symptoms.join(', ')}]`, 'Demo');
      LoggerService.info(`Emergency Level: ${xaiReport.emergencyLevel}`, 'Demo');
      LoggerService.info(`Nearest Facility: ${xaiReport.facilityName} (ETA: ${xaiReport.eta})`, 'Demo');
      LoggerService.info(`Inventory Status: ${xaiReport.inventoryStatus}`, 'Demo');
      LoggerService.info(`Delivery Mode: ${xaiReport.deliveryMode}`, 'Demo');
      LoggerService.info(`Risk Evaluation Level: ${xaiReport.riskLevel}`, 'Demo');
      LoggerService.info(`Overall Fused Confidence: ${xaiReport.overallConfidence}%`, 'Demo');
      
      // Confidence Breakdown display
      const bd = Object.entries(xaiReport.confidenceBreakdown).map(([agent, conf]) => `${agent}: ${conf}%`).join(' | ');
      LoggerService.info(`Confidence Breakdown: [${bd}]`, 'Demo');
      
      LoggerService.info(`Requires Human Review: ${xaiReport.requiresReview ? 'YES' : 'NO'}`, 'Demo');
      if (xaiReport.requiresReview) {
        LoggerService.warn(`Human Review Reason: ${xaiReport.humanReviewReason}`, 'Demo');
      }
      
      LoggerService.info(`Final Recommendation: ${xaiReport.finalRecommendation}`, 'Demo');
      LoggerService.success(`Patient-Friendly Explanation: "${xaiReport.patientFriendlyExplanation}"`, 'Demo');
    } else {
      LoggerService.error('Explainability Report was not generated.', 'Demo');
    }
    LoggerService.info('================================================', 'Demo');
  }

  LoggerService.info('========================================================', 'Demo');
  LoggerService.info('MedX Multi-Agent Orchestration Demo Run Fully Completed', 'Demo');
  LoggerService.info('========================================================', 'Demo');

  // Stop logger
  ExecutionLogger.stopListening();
}
export default runDemoPipeline;
