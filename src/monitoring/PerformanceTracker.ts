import { EventBus } from '../core/EventBus';

export class PerformanceTracker {
  private static latencyHistory: number[] = [];

  static startTracking() {
    EventBus.subscribe(event => {
      if (event.type === 'PIPELINE_COMPLETED') {
        const latency = event.payload.latencyMs ?? 0;
        this.latencyHistory.push(latency);
      }
    });
  }

  static getHistory(): number[] {
    return this.latencyHistory;
  }
}
// Start tracking on module load
PerformanceTracker.startTracking();
export default PerformanceTracker;
