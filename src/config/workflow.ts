import { WorkflowConfig } from '../types/workflow';

export const workflowConfig: WorkflowConfig = {
  pipeline: ['gemini', 'triage', 'memory', 'ece', 'gis', 'inventory', 'logistics', 'decision']
};
