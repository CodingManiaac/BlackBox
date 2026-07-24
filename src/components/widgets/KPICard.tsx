import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';

interface KPICardProps {
  title: string;
  value: string | number;
  badgeText?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info';
  description?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  badgeText,
  badgeVariant = 'success',
  description
}) => {
  return (
    <Card shadow="sm" hoverLift={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="medx-caption" style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {title}
          </span>
          {badgeText && (
            <Badge variant={badgeVariant}>
              {badgeText}
            </Badge>
          )}
        </div>
        
        <h3 className="medx-title" style={{ fontSize: '28px', margin: 0 }}>
          {value}
        </h3>

        {description && (
          <p className="medx-caption" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
    </Card>
  );
};
export default KPICard;
