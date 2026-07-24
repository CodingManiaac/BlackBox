import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';

interface AgentCardProps {
  name: string;
  role: string;
  status: 'Idle' | 'Running' | 'Completed' | 'Failed';
  latencyMs: number;
  confidence: number;
  requestsCount: number;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  name,
  role,
  status,
  latencyMs,
  confidence,
  requestsCount
}) => {
  const getStatusVariant = () => {
    switch (status) {
      case 'Running': return 'warning';
      case 'Completed': return 'success';
      case 'Failed': return 'danger';
      default: return 'info';
    }
  };

  return (
    <Card shadow="sm" hoverLift={false}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{name}</h4>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{role}</span>
        </div>
        <Badge variant={getStatusVariant()}>
          {status}
        </Badge>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Latency</span>
          <strong>{latencyMs} ms</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Confidence</span>
          <strong style={{ color: 'var(--color-primary)' }}>{confidence}%</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Processed Cases</span>
          <strong>{requestsCount} requests</strong>
        </div>
      </div>
    </Card>
  );
};
export default AgentCard;
