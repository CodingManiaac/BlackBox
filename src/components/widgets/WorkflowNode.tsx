import React from 'react';

interface WorkflowNodeProps {
  label: string;
  iconText: string;
  status: 'Waiting' | 'Running' | 'Completed' | 'Failed';
}

export const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  label,
  iconText,
  status
}) => {
  const getColors = () => {
    switch (status) {
      case 'Running':
        return {
          bg: 'rgba(59, 130, 246, 0.1)',
          border: 'var(--color-primary)',
          icon: 'var(--color-primary)',
          shadow: '0 0 12px var(--color-primary-light)',
          animation: 'pulse 1.5s infinite alternate'
        };
      case 'Completed':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'var(--color-success)',
          icon: 'var(--color-success)',
          shadow: 'none',
          animation: 'none'
        };
      case 'Failed':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'var(--color-danger)',
          icon: 'var(--color-danger)',
          shadow: 'none',
          animation: 'none'
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.02)',
          border: 'var(--color-border)',
          icon: 'var(--color-text-muted)',
          shadow: 'none',
          animation: 'none'
        };
    }
  };

  const themeColors = getColors();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 4px rgba(59, 130, 246, 0.3); }
          100% { transform: scale(1.08); box-shadow: 0 0 16px rgba(59, 130, 246, 0.6); }
        }
      `}</style>

      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: themeColors.bg,
          border: `2px solid ${themeColors.border}`,
          boxShadow: themeColors.shadow,
          animation: themeColors.animation,
          transition: 'all 0.3s ease-in-out',
          fontSize: '20px'
        }}
      >
        <span style={{ color: themeColors.icon }}>{iconText}</span>
      </div>

      <span
        style={{
          fontSize: '11px',
          fontWeight: status === 'Running' ? 700 : 500,
          color: status === 'Waiting' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          textAlign: 'center',
          whiteSpace: 'nowrap'
        }}
      >
        {label}
      </span>
    </div>
  );
};
export default WorkflowNode;
