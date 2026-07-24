import { EventBus } from '../core/EventBus';

export interface AgentStatusTracker {
  id: string;
  name: string;
  status: 'Idle' | 'Running' | 'Completed' | 'Failed';
  latencyMs: number;
  confidence: number;
  requestsCount: number;
}

export class AgentMonitor {
  private static trackers: Record<string, AgentStatusTracker> = {
    triage: { id: 'triage', name: 'Triage Agent', status: 'Idle', latencyMs: 0, confidence: 95, requestsCount: 0 },
    ece: { id: 'ece', name: 'ECE Engine', status: 'Idle', latencyMs: 0, confidence: 96, requestsCount: 0 },
    gis: { id: 'gis', name: 'GIS Agent', status: 'Idle', latencyMs: 0, confidence: 94, requestsCount: 0 },
    inventory: { id: 'inventory', name: 'Inventory Agent', status: 'Idle', latencyMs: 0, confidence: 97, requestsCount: 0 },
    logistics: { id: 'logistics', name: 'Logistics Agent', status: 'Idle', latencyMs: 0, confidence: 93, requestsCount: 0 },
    decision: { id: 'decision', name: 'Decision Engine', status: 'Idle', latencyMs: 0, confidence: 99, requestsCount: 0 }
  };

  private static listeners: Set<(trackers: Record<string, AgentStatusTracker>) => void> = new Set();
  private static isSubscribed = false;

  static startTracking() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    EventBus.subscribe(event => {
      const agentId = event.payload.agentId;
      if (!agentId || !this.trackers[agentId]) return;

      const tracker = this.trackers[agentId];
      
      if (event.type === 'AGENT_STARTED') {
        tracker.status = 'Running';
        tracker.requestsCount++;
      } else if (event.type === 'AGENT_FINISHED') {
        tracker.status = 'Completed';
        tracker.latencyMs = event.payload.latencyMs ?? 0;
        
        // Retrieve confidence from context output
        const context = event.payload.context;
        if (context) {
          const outObj = context.agentOutputs.find(o => o.agentId === agentId);
          if (outObj) {
            tracker.confidence = outObj.confidence;
          }
        }
      } else if (event.type === 'AGENT_FAILED') {
        tracker.status = 'Failed';
      }

      this.notifyListeners();
    });
  }

  static getTrackers(): Record<string, AgentStatusTracker> {
    return this.trackers;
  }

  static subscribe(callback: (trackers: Record<string, AgentStatusTracker>) => void): () => void {
    this.startTracking();
    this.listeners.add(callback);
    callback(this.trackers);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.trackers }));
  }
}
export default AgentMonitor;
