import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export interface ActivityItem {
  id: string;
  title: string;
  time: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info';
}

interface ActivityFeedProps {
  title: string;
  activities: ActivityItem[];
  onItemClick?: (id: string) => void;
  onClearAll?: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ title, activities, onItemClick, onClearAll }) => {
  return (
    <Card shadow="sm" hoverLift={false} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="medx-card-title" style={{ margin: 0 }}>{title}</h3>
        {onClearAll && activities.length > 0 && (
          <button 
            onClick={onClearAll} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-primary)', 
              fontSize: '12px', 
              cursor: 'pointer',
              fontWeight: 600,
              padding: 0
            }}
          >
            Clear All
          </button>
        )}
      </div>
      
      {activities.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', minHeight: '80px' }} className="medx-caption">
          No recent activity logs.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {activities.map((act) => (
            <div 
              key={act.id} 
              onClick={() => onItemClick?.(act.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--color-border)',
                cursor: onItemClick ? 'pointer' : 'default'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="medx-body" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {act.title}
                </span>
                {act.description && (
                  <span className="medx-caption" style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {act.description}
                  </span>
                )}
                <span className="medx-caption" style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {act.time}
                </span>
              </div>

              {act.badgeText && (
                <Badge variant={act.badgeVariant || 'info'}>
                  {act.badgeText}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
export default ActivityFeed;
