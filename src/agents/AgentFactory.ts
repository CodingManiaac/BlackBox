import { BaseAgent } from './BaseAgent';
import { RequestContext } from '../types/context';
import { LLMProvider } from '../services/LLMProvider';
import { TriageAgent } from './TriageAgent';
import { ECEAgent } from './ECEAgent';
import { GISAgent } from './GISAgent';
import { InventoryAgent } from './InventoryAgent';
import { LogisticsAgent } from './LogisticsAgent';
import { DecisionAgent } from './DecisionAgent';
import { GeminiAgent } from './GeminiAgent';
import { MemoryAgent } from './MemoryAgent';

export class MockAgent extends BaseAgent {
  async execute(context: RequestContext): Promise<RequestContext> {
    const start = Date.now();
    const response = await LLMProvider.generate({
      model: 'gemini-1.5-pro',
      prompt: `Evaluate query: "${context.query}" under agent domain "${this.id}"`
    });
    
    const latency = Date.now() - start;

    return {
      ...context,
      agentOutputs: [...context.agentOutputs, {
        agentId: this.id,
        timestamp: Date.now(),
        output: { summary: `Executed mock logic: ${this.id}`, details: response.content },
        confidence: response.confidence,
        tokensUsed: response.tokensUsed,
        latencyMs: latency
      }],
      executionTimeline: [...context.executionTimeline, {
        timestamp: Date.now(),
        stepName: this.name,
        status: 'FINISHED',
        message: `Mock agent ${this.id} finished with ${response.confidence}% confidence.`
      }]
    };
  }
}

export class AgentFactory {
  static create(id: string, name: string, role: string, dependencies: string[] = []): BaseAgent {
    switch (id) {
      case 'gemini':
        return new GeminiAgent(id, name, role, dependencies);
      case 'triage':
        return new TriageAgent(id, name, role, dependencies);
      case 'memory':
        return new MemoryAgent(id, name, role, dependencies);
      case 'ece':
        return new ECEAgent(id, name, role, dependencies);
      case 'gis':
        return new GISAgent(id, name, role, dependencies);
      case 'inventory':
        return new InventoryAgent(id, name, role, dependencies);
      case 'logistics':
        return new LogisticsAgent(id, name, role, dependencies);
      case 'decision':
        return new DecisionAgent(id, name, role, dependencies);
      default:
        return new MockAgent(id, name, role, dependencies);
    }
  }
}
