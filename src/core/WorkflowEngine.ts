import { RequestContext } from '../types/context';
import { AgentRegistry } from './AgentRegistry';
import { RetryManager } from './RetryManager';
import { EventService } from '../services/EventService';
import { ConfidenceFusion } from './ConfidenceFusion';
import { LoggerService } from '../services/LoggerService';

export class WorkflowEngine {
  static async executeWorkflow(context: RequestContext, pipeline: string[]): Promise<RequestContext> {
    let currentContext = context;
    
    // Determine active sorted agents
    const activeAgents = AgentRegistry.getSortedActiveAgents(pipeline);
    
    EventService.emit('WORKFLOW_STARTED', context.requestId, 'Orchestration pipeline execution sequence started.', {
      context: currentContext
    });

    const executedAgents: string[] = [];

    try {
      for (const agent of activeAgents) {
        const metadata = agent.metadata();
        const config = AgentRegistry.getConfiguration(metadata.id)!;

        // Verify dependencies dynamically
        const passesVal = await agent.validate(currentContext);
        if (!passesVal) {
          throw new Error(`Agent ${metadata.id} prerequisite validation check failed!`);
        }

        EventService.emit('AGENT_STARTED', context.requestId, `Executing agent: ${metadata.name}`, {
          agentId: metadata.id,
          context: currentContext
        });

        // Run beforeExecute hook
        currentContext = await agent.beforeExecute(currentContext);

        const start = Date.now();
        // Execute with retry support
        currentContext = await RetryManager.executeWithRetry(
          () => agent.execute(currentContext),
          config,
          (attempt, error) => {
            EventService.emit('RETRY_STARTED', context.requestId, `Retrying agent ${metadata.id} execution (Attempt #${attempt}).`, {
              agentId: metadata.id,
              error: error.message || String(error)
            });
          }
        );
        const latency = Date.now() - start;

        // Run afterExecute hook
        currentContext = await agent.afterExecute(currentContext);

        executedAgents.push(metadata.id);

        EventService.emit('AGENT_FINISHED', context.requestId, `Completed agent: ${metadata.name} (${latency}ms)`, {
          agentId: metadata.id,
          context: currentContext,
          latencyMs: latency
        });
      }

      // Finalize: Calculate combined confidence score via Confidence Fusion
      const overallConfidence = ConfidenceFusion.calculate(currentContext.agentOutputs);
      
      currentContext = {
        ...currentContext,
        overallConfidence,
        status: 'COMPLETED',
        workflowStage: 'Finalize'
      };

      EventService.emit('WORKFLOW_FINISHED', context.requestId, `Workflow completed successfully. Final Confidence: ${overallConfidence}%`, {
        context: currentContext
      });

      return currentContext;

    } catch (err: any) {
      const errorMsg = err.message || String(err);
      EventService.emit('AGENT_FAILED', context.requestId, `Pipeline failed during execution: ${errorMsg}`, {
        error: errorMsg
      });

      // Rollback executed agents in reverse order
      LoggerService.warn('Initiating rollbacks for completed transaction elements...', 'WorkflowEngine');
      for (let i = executedAgents.length - 1; i >= 0; i--) {
        const rollbackAgentId = executedAgents[i];
        const agent = AgentRegistry.getAgent(rollbackAgentId);
        if (agent) {
          currentContext = await agent.rollback(currentContext);
        }
      }

      currentContext = {
        ...currentContext,
        status: 'FAILED',
        systemWarnings: [...currentContext.systemWarnings, `Rollback executed due to error: ${errorMsg}`]
      };

      return currentContext;
    }
  }
}
export default WorkflowEngine;
