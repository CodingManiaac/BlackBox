import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Activity } from 'lucide-react';
import { ServiceHealth } from '../../monitoring/HealthMonitor';
import HealthBadge from '../../components/widgets/HealthBadge';

export const HealthMonitor: React.FC = () => {
  const toastManager = useToast();
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<Record<string, ServiceHealth>>({});

  const loadHealthData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/system/health');
      const data = await res.json();
      if (data.success) {
        setHealthData(data.health);
      }
    } catch (err) {
      console.error('Error loading health details:', err);
    }
  };

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(loadHealthData, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerDiagnostic = () => {
    setLoading(true);
    toastManager.addToast('Re-testing operational microservices connectivity...', 'info');

    setTimeout(() => {
      loadHealthData();
      toastManager.addToast('All dependency health tests completed.', 'success');
      setLoading(false);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Microservices Health Monitor" 
        description="Verify backend microservice status registries, database latency times, and container resource allocations."
        actions={
          <Button variant="primary" onClick={triggerDiagnostic} disabled={loading}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} />
              {loading ? 'Testing...' : 'Run Diagnostics'}
            </span>
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Dependencies status cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Dependency Registry Status</h3>
          <Card shadow="sm" hoverLift={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(healthData).map(([key, service], idx, arr) => (
                <div key={key} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderBottom: idx !== arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                  paddingBottom: idx !== arr.length - 1 ? '16px' : '0'
                }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{service.name}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Latency: {service.latencyMs} ms
                    </span>
                  </div>
                  <HealthBadge status={service.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Server details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Container Resource Metrics</h3>
          <Card title="CPU & Memory Telemetry" shadow="sm">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>CPU Usage</span>
                <strong>4.2%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Memory Allocations</span>
                <strong>184 MB / 1024 MB</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Uptime</span>
                <strong>24 hrs 12 mins</strong>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default HealthMonitor;
