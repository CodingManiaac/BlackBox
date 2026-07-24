import React from 'react';
import WorkflowNode from './WorkflowNode';

interface PipelineAnimatorProps {
  activeStep: string | null;
  completedSteps: string[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export const PipelineAnimator: React.FC<PipelineAnimatorProps> = ({
  activeStep,
  completedSteps,
  status
}) => {
  const steps = [
    { id: 'triage', label: 'Triage Agent', icon: '🩺' },
    { id: 'ece', label: 'ECE Engine', icon: '⚡' },
    { id: 'gis', label: 'GIS Agent', icon: '🗺' },
    { id: 'inventory', label: 'Inventory Agent', icon: '💊' },
    { id: 'logistics', label: 'Logistics Agent', icon: '🚚' },
    { id: 'decision', label: 'Decision Engine', icon: '🧠' }
  ];

  const getStepStatus = (stepId: string) => {
    if (status === 'FAILED' && activeStep === stepId) return 'Failed';
    if (completedSteps.includes(stepId)) return 'Completed';
    if (activeStep === stepId) return 'Running';
    return 'Waiting';
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '24px 12px',
        backgroundColor: 'rgba(255,255,255,0.01)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflowX: 'auto',
        gap: '8px'
      }}
    >
      {/* Patient Node */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid var(--color-success)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px',
            color: 'var(--color-success)'
          }}
        >
          👤
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Patient Request</span>
      </div>

      {steps.map((step, idx) => {
        const stepStatus = getStepStatus(step.id);
        const nextStepIsRunning = idx < steps.length && activeStep === step.id;

        return (
          <React.Fragment key={step.id}>
            {/* Animated Connector Arrow */}
            <div
              style={{
                flex: 1,
                height: '3px',
                minWidth: '24px',
                backgroundColor: completedSteps.includes(step.id) ? 'var(--color-success)' : 'var(--color-border)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '2px'
              }}
            >
              {nextStepIsRunning && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '30px',
                    background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
                    animation: 'slideRight 1s infinite linear'
                  }}
                />
              )}
            </div>

            <WorkflowNode
              label={step.label}
              iconText={step.icon}
              status={stepStatus}
            />
          </React.Fragment>
        );
      })}

      {/* Done Node */}
      <div style={{ display: 'flex', flex: 1, height: '3px', minWidth: '24px', backgroundColor: status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-border)' }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
            border: `2px solid ${status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-border)'}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px',
            color: status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-text-muted)'
          }}
        >
          ✅
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: status === 'COMPLETED' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>Completed</span>
      </div>

      <style>{`
        @keyframes slideRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};
export default PipelineAnimator;
