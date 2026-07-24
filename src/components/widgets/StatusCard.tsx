import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export interface HealthComponent {
  name: string;
  status: 'success' | 'warning' | 'danger' | 'info';
  statusText: string;
  metric?: string;
}

interface StatusCardProps {
  title: string;
  components: HealthComponent[];
}

export const StatusCard: React.FC<StatusCardProps> = ({ title, components }) => {
  return (
    <Card shadow="sm" hoverLift={false}>
      <h3 className="medx-card-title" style={{ marginBottom: '16px' }}>{title}</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {components.map((comp, idx) => (
          <div 
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--color-border)',
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="medx-caption" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {comp.name}
              </span>
              {comp.metric && (
                <span className="medx-caption" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {comp.metric}
                </span>
              )}
            </div>

            <Badge variant={comp.status}>
              {comp.statusText}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
export default StatusCard;
