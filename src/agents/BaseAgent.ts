import { IAgent, AgentMetadata, AgentHealth } from '../types/agent';
import { RequestContext } from '../types/context';
import { LoggerService } from '../services/LoggerService';

export abstract class BaseAgent implements IAgent {
  protected id: string;
  protected name: string;
  protected role: string;
  protected dependencies: string[];

  constructor(id: string, name: string, role: string, dependencies: string[] = []) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.dependencies = dependencies;
  }

  metadata(): AgentMetadata {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      dependencies: this.dependencies
    };
  }

  health(): AgentHealth {
    return {
      isHealthy: true,
      statusMessage: 'Agent fully operational.'
    };
  }

  async validate(context: RequestContext): Promise<boolean> {
    LoggerService.info(`Validating prerequisites for agent ${this.id}...`, this.name);
    // Check that dependencies are completed
    for (const dep of this.dependencies) {
      const depCompleted = context.agentOutputs.some(out => out.agentId === dep);
      if (!depCompleted) {
        LoggerService.error(`Dependency check failed: agent ${dep} outputs missing!`, this.name);
        return false;
      }
    }
    return true;
  }

  async beforeExecute(context: RequestContext): Promise<RequestContext> {
    LoggerService.info(`Running lifecycle beforeExecute hooks...`, this.name);
    return context;
  }

  abstract execute(context: RequestContext): Promise<RequestContext>;

  async afterExecute(context: RequestContext): Promise<RequestContext> {
    LoggerService.info(`Running lifecycle afterExecute hooks...`, this.name);
    return context;
  }

  async rollback(context: RequestContext): Promise<RequestContext> {
    LoggerService.warn(`Rolling back transaction state mutations...`, this.name);
    // Return context unchanged by default
    return context;
  }
}
export default BaseAgent;
