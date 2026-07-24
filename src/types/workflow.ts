export interface AgentConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  retryLimit: number;
  retryDelayMs: number;
  weight: number; // For confidence score calculations
}

export interface WorkflowConfig {
  pipeline: string[];
}
