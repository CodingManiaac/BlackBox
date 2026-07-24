import React from 'react';
import Card from '../common/Card';

export interface TimelineStep {
  id: string | number;
  title: string;
  description: string;
  time?: string;
  status: 'completed' | 'active' | 'pending';
}

interface TimelineProps {
  title: string;
  steps: TimelineStep[];
}

export const Timeline: React.FC<TimelineProps> = ({ title, steps }) => {
  return (
    <Card shadow="sm" hoverLift={false}>
      <h3 className="medx-card-title" style={{ marginBottom: '24px' }}>{title}</h3>

      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          
          let circleBg = '#E5E7EB';
          let circleBorder = '2px solid #E5E7EB';
          let textWeight = 'var(--font-weight-regular)';
          let titleColor = 'var(--color-text-secondary)';

          if (isCompleted) {
            circleBg = 'var(--color-primary)';
            circleBorder = '2px solid var(--color-primary)';
            titleColor = 'var(--color-text-primary)';
          } else if (isActive) {
            circleBg = 'var(--color-surface)';
            circleBorder = '2px solid var(--color-primary)';
            textWeight = 'var(--font-weight-semibold)';
            titleColor = 'var(--color-text-primary)';
          }

          return (
            <div key={step.id} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: idx === steps.length - 1 ? 0 : '24px' }}>
              {/* Connecting Line */}
              {idx !== steps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '7px',
                  top: '16px',
                  bottom: 0,
                  width: '2px',
                  backgroundColor: isCompleted ? 'var(--color-primary)' : '#E5E7EB',
                  zIndex: 1
                }}></div>
              )}

              {/* Step Circle indicator */}
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: circleBg,
                border: circleBorder,
                zIndex: 2,
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive ? '0 0 0 4px rgba(37, 99, 235, 0.15)' : 'none'
              }}>
                {isCompleted && (
                  <div style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '50%' }}></div>
                )}
              </div>

              {/* Text content */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: textWeight as 'bold' | 'normal' | number,
                    color: titleColor,
                    margin: 0
                  }}>
                    {step.title}
                  </h4>
                  {step.time && (
                    <span className="medx-caption" style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {step.time}
                    </span>
                  )}
                </div>
                <p className="medx-caption" style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
export default Timeline;
