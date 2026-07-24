import React from 'react';
import Card from './Card';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onActionClick
}) => {
  return (
    <Card hoverLift={false} style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        maxWidth: '420px',
        margin: '0 auto'
      }}>
        {icon && (
          <div style={{
            fontSize: '48px',
            color: 'var(--color-text-secondary)',
            opacity: 0.6,
            marginBottom: '4px'
          }}>
            {icon}
          </div>
        )}
        <h3 className="medx-card-title" style={{ fontSize: '20px' }}>{title}</h3>
        <p className="medx-body" style={{ fontSize: '14px', margin: 0 }}>
          {description}
        </p>
        {actionLabel && onActionClick && (
          <Button 
            variant="secondary" 
            onClick={onActionClick}
            style={{ marginTop: '8px' }}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};
export default EmptyState;
