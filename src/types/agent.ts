import { RequestContext } from './context';

export interface AgentMetadata {
  id: string;
  name: string;
  role: string;
  dependencies: string[];
}

export interface AgentHealth {
  isHealthy: boolean;
  statusMessage: string;
}

export interface IAgent {
  metadata: () => AgentMetadata;
  health: () => AgentHealth;
  validate: (context: RequestContext) => Promise<boolean>;
  beforeExecute: (context: RequestContext) => Promise<RequestContext>;
  execute: (context: RequestContext) => Promise<RequestContext>;
  afterExecute: (context: RequestContext) => Promise<RequestContext>;
  rollback: (context: RequestContext) => Promise<RequestContext>;
}
