import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import MetricsCard from '../../components/widgets/MetricsCard';
import { PerformanceMetrics } from '../../monitoring/MetricsCollector';

export const Metrics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    averageLatencyMs: 0,
    slowestAgent: { id: 'None', latencyMs: 0 },
    fastestAgent: { id: 'None', latencyMs: 0 },
    totalTokensUsed: 0
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/admin/metrics');
        const data = await res.json();
        if (data.success) {
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error('Error loading performance metrics:', err);
      }
    };
    loadMetrics();
    const interval = setInterval(loadMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  const getSuccessRate = () => {
    const total = metrics.successCount + metrics.failureCount;
    if (total === 0) return '100%';
    return `${Math.round((metrics.successCount / total) * 100)}%`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="System Census Metrics" 
        description="Verify weekly logistics ETAs, audit AI semantic accuracies, and monitor daily emergency loads."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <MetricsCard
          title="Total Processed Requests"
          value={metrics.totalRequests}
          subValue="Intakes registered"
          icon="📥"
        />
        <MetricsCard
          title="Engine Success Rate"
          value={getSuccessRate()}
          subValue={`${metrics.successCount} approved dispatches`}
          icon="📈"
        />
        <MetricsCard
          title="Average Pipeline Latency"
          value={`${metrics.averageLatencyMs} ms`}
          subValue="Orchestrator transit speed"
          icon="⚡"
        />
        <MetricsCard
          title="Total Tokens Used"
          value={metrics.totalTokensUsed}
          subValue="Approximate mock load"
          icon="🪙"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '12px' }}>
        <MetricsCard
          title="Slowest Component Agent"
          value={metrics.slowestAgent.id.toUpperCase()}
          subValue={`Highest latency: ${metrics.slowestAgent.latencyMs} ms`}
          icon="🐢"
        />
        <MetricsCard
          title="Fastest Component Agent"
          value={metrics.fastestAgent.id === 'None' ? 'NONE' : metrics.fastestAgent.id.toUpperCase()}
          subValue={`Lowest latency: ${metrics.fastestAgent.latencyMs} ms`}
          icon="🐇"
        />
      </div>
    </div>
  );
};
export default Metrics;
