import { EventBus } from '../core/EventBus';

export interface WorkflowRunState {
  requestId: string;
  activeStep: string | null;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  completedSteps: string[];
}

export class WorkflowMonitor {
  private static activeState: WorkflowRunState = {
    requestId: '',
    activeStep: null,
    status: 'PENDING',
    completedSteps: []
  };

  private static listeners: Set<(state: WorkflowRunState) => void> = new Set();
  private static isSubscribed = false;

  static startTracking() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    EventBus.subscribe(event => {
      if (event.type === 'WORKFLOW_STARTED') {
        this.activeState = {
          requestId: event.requestId,
          activeStep: 'Intake',
          status: 'RUNNING',
          completedSteps: []
        };
      } else if (event.type === 'AGENT_STARTED') {
        this.activeState.activeStep = event.payload.agentId ?? null;
      } else if (event.type === 'AGENT_FINISHED') {
        if (event.payload.agentId) {
          this.activeState.completedSteps.push(event.payload.agentId);
        }
      } else if (event.type === 'WORKFLOW_FINISHED') {
        this.activeState.status = 'COMPLETED';
        this.activeState.activeStep = null;
      } else if (event.type === 'AGENT_FAILED') {
        this.activeState.status = 'FAILED';
        this.activeState.activeStep = null;
      }

      this.notifyListeners();
    });
  }

  static getActiveState(): WorkflowRunState {
    return this.activeState;
  }

  static subscribe(callback: (state: WorkflowRunState) => void): () => void {
    this.startTracking();
    this.listeners.add(callback);
    callback(this.activeState);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.activeState }));
  }
}
export default WorkflowMonitor;
