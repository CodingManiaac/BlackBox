import { BaseAgent } from '../agents/BaseAgent';
import { AgentConfig } from '../types/workflow';
import { LoggerService } from '../services/LoggerService';

export class AgentRegistry {
  private static registeredAgents: Map<string, BaseAgent> = new Map();
  private static configurations: Map<string, AgentConfig> = new Map();

  static register(agent: BaseAgent, config: AgentConfig) {
    this.registeredAgents.set(agent.metadata().id, agent);
    this.configurations.set(config.id, config);
    LoggerService.info(`Registered agent "${agent.metadata().name}" dynamically in registry.`, 'AgentRegistry');
  }

  static unregister(agentId: string) {
    this.registeredAgents.delete(agentId);
    this.configurations.delete(agentId);
    LoggerService.warn(`Unregistered agent "${agentId}".`, 'AgentRegistry');
  }

  static enableAgent(agentId: string) {
    const config = this.configurations.get(agentId);
    if (config) {
      config.enabled = true;
      LoggerService.info(`Enabled agent: ${agentId}`, 'AgentRegistry');
    }
  }

  static disableAgent(agentId: string) {
    const config = this.configurations.get(agentId);
    if (config) {
      config.enabled = false;
      LoggerService.info(`Disabled agent: ${agentId}`, 'AgentRegistry');
    }
  }

  static getAgent(agentId: string): BaseAgent | undefined {
    return this.registeredAgents.get(agentId);
  }

  static getConfiguration(agentId: string): AgentConfig | undefined {
    return this.configurations.get(agentId);
  }

  static getSortedActiveAgents(pipeline: string[]): BaseAgent[] {
    const activeAgents: BaseAgent[] = [];
    
    // Sort agent execution order based on config priority values
    const sortedIds = [...pipeline].sort((a, b) => {
      const configA = this.configurations.get(a);
      const configB = this.configurations.get(b);
      return (configA?.priority ?? 0) - (configB?.priority ?? 0);
    });

    for (const id of sortedIds) {
      const agent = this.registeredAgents.get(id);
      const config = this.configurations.get(id);
      if (agent && config?.enabled) {
        activeAgents.push(agent);
      }
    }

    return activeAgents;
  }

  static validateDependencies(pipeline: string[]): boolean {
    for (const id of pipeline) {
      const agent = this.registeredAgents.get(id);
      if (agent) {
        const metadata = agent.metadata();
        for (const dep of metadata.dependencies) {
          if (!pipeline.includes(dep)) {
            LoggerService.error(`Workflow validation failed: Agent ${id} depends on unregistered/disabled step ${dep}.`, 'AgentRegistry');
            return false;
          }
        }
      }
    }
    return true;
  }

  static clear() {
    this.registeredAgents.clear();
    this.configurations.clear();
  }
}
