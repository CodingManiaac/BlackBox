import React from 'react';

interface TimelineCardProps {
  timeline: readonly string[];
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ timeline }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
      {timeline.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
          {index < timeline.length - 1 && (
            <div
              style={{
                position: 'absolute',
                left: '6px',
                top: '16px',
                bottom: '-20px',
                width: '2px',
                backgroundColor: 'var(--color-border)'
              }}
            />
          )}

          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              border: '3px solid var(--color-background-card)',
              zIndex: 1,
              marginTop: '4px'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>{item}</span>
          </div>
        </div>
      ))}
      
      {timeline.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
          No execution logs yet. Click "Run Pipeline" to start.
        </div>
      )}
    </div>
  );
};
export default TimelineCard;
