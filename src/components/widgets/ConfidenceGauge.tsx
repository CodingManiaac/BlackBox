import React from 'react';

interface ConfidenceGaugeProps {
  label: string;
  value: number;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ label, value }) => {
  const getBarColor = () => {
    if (value >= 90) return 'var(--color-success)';
    if (value >= 70) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '6px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ color: getBarColor() }}>{value}%</span>
      </div>
      <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            backgroundColor: getBarColor(),
            borderRadius: '3px',
            transition: 'width 0.8s ease-in-out'
          }}
        />
      </div>
    </div>
  );
};
export default ConfidenceGauge;
