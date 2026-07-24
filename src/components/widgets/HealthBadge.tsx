import React from 'react';

interface HealthBadgeProps {
  status: 'Online' | 'Offline' | 'Degraded';
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case 'Online':
        return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', text: 'Online' };
      case 'Degraded':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', text: 'Degraded' };
      default:
        return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', text: 'Offline' };
    }
  };

  const current = getColors();

  return (
    <span
      style={{
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.color}`
      }}
    >
      {current.text}
    </span>
  );
};
export default HealthBadge;
