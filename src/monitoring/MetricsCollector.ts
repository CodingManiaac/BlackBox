import { EventBus } from '../core/EventBus';

export interface PerformanceMetrics {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
  slowestAgent: { id: string; latencyMs: number };
  fastestAgent: { id: string; latencyMs: number };
  totalTokensUsed: number;
}

export class MetricsCollector {
  private static metrics: PerformanceMetrics = {
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    averageLatencyMs: 0,
    slowestAgent: { id: 'None', latencyMs: 0 },
    fastestAgent: { id: 'None', latencyMs: Infinity },
    totalTokensUsed: 0
  };

  private static totalCumulativeLatency = 0;
  private static listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private static isSubscribed = false;

  static startTracking() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    EventBus.subscribe(event => {
      if (event.type === 'WORKFLOW_STARTED') {
        this.metrics.totalRequests++;
      } else if (event.type === 'PIPELINE_COMPLETED') {
        const latency = event.payload.latencyMs ?? 0;
        this.totalCumulativeLatency += latency;
        
        // Success checks
        const context = event.payload.context;
        if (context && context.status === 'COMPLETED') {
          this.metrics.successCount++;
        } else {
          this.metrics.failureCount++;
        }

        // Compute averages
        const count = this.metrics.successCount + this.metrics.failureCount;
        this.metrics.averageLatencyMs = count > 0 ? Math.round(this.totalCumulativeLatency / count) : 0;
        
        if (context) {
          // Tokens checks
          for (const out of context.agentOutputs) {
            if (out.tokensUsed) {
              this.metrics.totalTokensUsed += out.tokensUsed;
            }
            const agentLatency = out.latencyMs ?? 0;
            
            // Slowest check
            if (agentLatency > this.metrics.slowestAgent.latencyMs) {
              this.metrics.slowestAgent = { id: out.agentId, latencyMs: agentLatency };
            }
            
            // Fastest check
            if (agentLatency < this.metrics.fastestAgent.latencyMs && agentLatency > 0) {
              this.metrics.fastestAgent = { id: out.agentId, latencyMs: agentLatency };
            }
          }
        }
        
        this.notifyListeners();
      }
    });
  }

  static getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  static subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.startTracking();
    this.listeners.add(callback);
    callback(this.metrics);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.metrics }));
  }
}
export default MetricsCollector;
