import React from 'react';
import Card from '../common/Card';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subValue,
  icon
}) => {
  return (
    <Card shadow="sm">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
            {title}
          </span>
          <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {value}
          </h2>
          {subValue && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
              {subValue}
            </span>
          )}
        </div>
        {icon && (
          <div style={{ fontSize: '24px', opacity: 0.6 }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
export default MetricsCard;
