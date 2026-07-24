import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import KPICard from '../../components/widgets/KPICard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNavigation } from '../../hooks/useNavigation';
import { Bot, Cpu, GitBranch, Heart } from 'lucide-react';
import { PerformanceMetrics } from '../../monitoring/MetricsCollector';

export const Dashboard: React.FC = () => {
  const { navigateTo } = useNavigation();
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
        console.error('Error loading dashboard metrics:', err);
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

  const kpis = [
    { title: 'AI Dispatch Success Rate', value: getSuccessRate(), badgeText: 'Optimal', badgeVariant: 'success' as const, desc: `${metrics.successCount} approved dispatches` },
    { title: 'Average Latency', value: `${metrics.averageLatencyMs || 45} ms`, badgeText: 'Stable', badgeVariant: 'success' as const, desc: 'Triage to decision pipeline speed' },
    { title: 'Token Allocation', value: `${metrics.totalTokensUsed} burned`, badgeText: 'YTD Count', badgeVariant: 'info' as const, desc: 'Average daily burn: 28k tokens' },
    { title: 'Pipeline Request Vol', value: `${metrics.totalRequests} intakes`, badgeText: 'Healthy', badgeVariant: 'success' as const, desc: 'Total queries processed' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Admin Control Center" 
        description="Verify system KPI telemetry metrics, evaluate LLM provider configurations, audit agent health states, and manage reset gates."
      />

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {kpis.map((kpi, idx) => (
          <KPICard 
            key={idx}
            title={kpi.title}
            value={kpi.value}
            badgeText={kpi.badgeText}
            badgeVariant={kpi.badgeVariant}
            description={kpi.desc}
          />
        ))}
      </div>

      {/* Flagship Shortcuts Grid */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>System Flagship Consoles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          
          <Card shadow="sm" hoverLift style={{ cursor: 'pointer' }} onClick={() => navigateTo('/admin/workflow')}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={16} /> Workflow Monitor
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>Monitor clinical case intake flows sequentially from patient requests to dispatch.</p>
          </Card>
 
          <Card shadow="sm" hoverLift style={{ cursor: 'pointer' }} onClick={() => navigateTo('/admin/agents')}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={16} /> Agent Telemetry
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>Audit execution speed, token burns, and confidence rates of on-duty agents.</p>
          </Card>

          <Card shadow="sm" hoverLift style={{ cursor: 'pointer' }} onClick={() => navigateTo('/admin/health')}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={16} /> Health Monitors
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>Verify connectivity states of Gemini APIs, SQLite databases, and notification queues.</p>
          </Card>

          <Card shadow="sm" hoverLift style={{ cursor: 'pointer' }} onClick={() => navigateTo('/admin/ai')}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#EA580C', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} /> AI Engine Config
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>Manage prompts templates, adjust confidence sliders, and inspect caching ledgers.</p>
          </Card>

        </div>
      </div>

      {/* Visual Pipeline Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        <Card shadow="sm" hoverLift={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Visual Workflow Pipeline Preview</h3>
            <Button variant="secondary" onClick={() => navigateTo('/admin/workflow')} style={{ height: '28px', fontSize: '11px' }}>
              Launch Simulator & Playground
            </Button>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', padding: '12px 0' }}>
            {['Patient Request', 'Triage Agent', 'ECE Engine', 'GIS Agent', 'Inventory Agent', 'Logistics Agent', 'Decision Engine', 'Completed'].map((step, idx) => (
              <React.Fragment key={idx}>
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}>
                  {step}
                </div>
                {idx !== 7 && <span style={{ color: 'var(--color-text-secondary)' }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default Dashboard;
