import { RequestContext } from '../types/context';
import { PipelineExecutionResult } from '../types/pipeline';
import { WorkflowEngine } from './WorkflowEngine';
import { AgentRegistry } from './AgentRegistry';
import { MemoryStore } from './MemoryStore';
import { workflowConfig } from '../config/workflow';
import { LoggerService } from '../services/LoggerService';
import { EventService } from '../services/EventService';

import { ExplainabilityEngine } from '../xai/ExplainabilityEngine';
import { AgentFactory } from '../agents/AgentFactory';
import { agentsConfig } from '../config/agents';
import { MemoryService } from '../services/MemoryService';

export class MedXEngine {
  static async processRequest(
    patientId: string, 
    query: string, 
    mode: 'Mock' | 'Production' = 'Mock'
  ): Promise<PipelineExecutionResult> {
    if (typeof window !== 'undefined') {
      const response = await fetch('http://localhost:3001/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, query, mode })
      });
      if (!response.ok) {
        throw new Error('MedX backend server returned error');
      }
      return await response.json() as PipelineExecutionResult;
    }

    // Ensure default agents are registered on-the-fly if registry is empty
    if (AgentRegistry.getSortedActiveAgents(workflowConfig.pipeline).length === 0) {
      const gemini = AgentFactory.create('gemini', 'Gemini NLU Agent', 'Natural Language Understanding', []);
      const triage = AgentFactory.create('triage', 'Triage Agent', 'Symptom NLP parsing', ['gemini']);
      const memory = AgentFactory.create('memory', 'Memory Agent (Supermemory)', 'Patient context memory retrieval', ['triage']);
      const ece = AgentFactory.create('ece', 'ECE Engine', 'Severity triage calculations', ['memory']);
      const gis = AgentFactory.create('gis', 'GIS Agent', 'Ambulance coordinate channels routing', ['ece']);
      const inventory = AgentFactory.create('inventory', 'Inventory Agent', 'Resource stock availability reservations', ['gis']);
      const logistics = AgentFactory.create('logistics', 'Logistics Agent', 'Rider/Drone courier dispatch coordinates', ['inventory']);
      const decision = AgentFactory.create('decision', 'Decision Engine', 'Clinical authentication confirmations', ['logistics']);

      AgentRegistry.register(gemini, agentsConfig.gemini);
      AgentRegistry.register(triage, agentsConfig.triage);
      AgentRegistry.register(memory, agentsConfig.memory);
      AgentRegistry.register(ece, agentsConfig.ece);
      AgentRegistry.register(gis, agentsConfig.gis);
      AgentRegistry.register(inventory, agentsConfig.inventory);
      AgentRegistry.register(logistics, agentsConfig.logistics);
      AgentRegistry.register(decision, agentsConfig.decision);
    }

    const start = Date.now();
    const requestId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    LoggerService.info(`Initial request received: "${query}" for patient ${patientId}`, 'MedXEngine');

    // Retrieve patient history memories
    const memory = await MemoryService.getPatientMemorySummary(patientId);

    // Instantiates immutable request context
    const initialContext: RequestContext = {
      requestId,
      patientId,
      timestamp: Date.now(),
      query,
      workflowStage: 'Request Received',
      overallConfidence: 1.0,
      status: 'PENDING',
      metadata: {
        mode,
        memorySummary: memory.summary,
        memoryProvider: memory.provider
      },
      agentOutputs: [],
      executionTimeline: [
        {
          timestamp: Date.now(),
          stepName: 'Intake',
          status: 'STARTED',
          message: 'MedX AI Orchestrator initialized RequestContext.'
        }
      ],
      systemWarnings: []
    };

    // Store in-memory
    MemoryStore.storeContext(requestId, initialContext);

    // Validate registry coordinates dependencies
    const passesDep = AgentRegistry.validateDependencies(workflowConfig.pipeline);
    if (!passesDep) {
      const errorMsg = 'Workflow registration dependency validation failed.';
      LoggerService.error(errorMsg, 'MedXEngine');
      
      const failedContext: RequestContext = {
        ...initialContext,
        status: 'FAILED',
        systemWarnings: [errorMsg]
      };
      
      return {
        requestId,
        finalContext: failedContext,
        success: false,
        totalLatencyMs: Date.now() - start,
        stepsExecuted: []
      };
    }

    // Sequentially run workflow steps
    let finalContext = await WorkflowEngine.executeWorkflow(initialContext, workflowConfig.pipeline);

    if (finalContext.status === 'COMPLETED') {
      finalContext = ExplainabilityEngine.generateReport(finalContext);
    }

    // Update in-memory state
    MemoryStore.storeContext(requestId, finalContext);
    
    const latency = Date.now() - start;
    const success = finalContext.status === 'COMPLETED';
    
    EventService.emit('PIPELINE_COMPLETED', requestId, `Orchestration workflow completed in ${latency}ms. Status: ${finalContext.status}`, {
      context: finalContext,
      latencyMs: latency
    });

    const stepsExecuted = finalContext.agentOutputs.map(out => out.agentId);

    return {
      requestId,
      finalContext,
      success,
      totalLatencyMs: latency,
      stepsExecuted
    };
  }
}
export default MedXEngine;
