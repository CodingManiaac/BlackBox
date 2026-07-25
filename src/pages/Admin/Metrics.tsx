import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import MetricsCard from '../../components/widgets/MetricsCard';
import { PerformanceMetrics } from '../../monitoring/MetricsCollector';

interface ExtendedMetrics extends PerformanceMetrics {
  totalUsers?: number;
  totalOrders?: number;
  activePharmacies?: number;
  activeBloodBanks?: number;
  activeHospitals?: number;
  emergencyRequests?: number;
  workflowCompletionRate?: string;
}

export const Metrics: React.FC = () => {
  const [metrics, setMetrics] = useState<ExtendedMetrics>({
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

      {/* Dynamic Admin Analytics Section */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>System Admin Analytics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          <MetricsCard title="Total Users" value={metrics.totalUsers ?? 0} subValue="Registered accounts" icon="👥" />
          <MetricsCard title="Total Orders" value={metrics.totalOrders ?? 0} subValue="Database records" icon="📦" />
          <MetricsCard title="Active Pharmacies" value={metrics.activePharmacies ?? 0} subValue="Locations" icon="🏥" />
          <MetricsCard title="Active Blood Banks" value={metrics.activeBloodBanks ?? 0} subValue="Facilities" icon="🩸" />
          <MetricsCard title="Active Hospitals" value={metrics.activeHospitals ?? 0} subValue="Clinical sites" icon="🏛️" />
          <MetricsCard title="Emergency Requests" value={metrics.emergencyRequests ?? 0} subValue="ECE Severity <= 2" icon="🚨" />
          <MetricsCard title="Workflow Completion Rate" value={metrics.workflowCompletionRate ?? '100%'} subValue="Pipeline throughput" icon="✅" />
        </div>
      </div>
    </div>
  );
};
export default Metrics;
