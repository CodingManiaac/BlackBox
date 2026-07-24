import { RequestContext } from './context';

export type MedXEventType = 
  | 'WORKFLOW_STARTED'
  | 'WORKFLOW_FINISHED'
  | 'AGENT_STARTED'
  | 'AGENT_FINISHED'
  | 'AGENT_FAILED'
  | 'WARNING_RAISED'
  | 'RETRY_STARTED'
  | 'RETRY_FINISHED'
  | 'PIPELINE_COMPLETED';

export interface MedXEvent {
  type: MedXEventType;
  timestamp: number;
  requestId: string;
  payload: {
    agentId?: string;
    message: string;
    context?: RequestContext;
    latencyMs?: number;
    error?: string;
  };
}

export type EventCallback = (event: MedXEvent) => void;
