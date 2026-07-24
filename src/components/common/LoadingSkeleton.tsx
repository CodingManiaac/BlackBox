import React from 'react';
import Card from './Card';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'text';
  rows?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'card', 
  rows = 3 
}) => {
  // Styles for shimmer animation
  const skeletonStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
    borderRadius: '4px'
  };

  const injectKeyframe = () => {
    if (typeof document !== 'undefined' && !document.getElementById('skeleton-keyframes')) {
      const style = document.createElement('style');
      style.id = 'skeleton-keyframes';
      style.innerHTML = `
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(style);
    }
  };
  injectKeyframe();

  if (type === 'table') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
            <div style={{ ...skeletonStyle, height: '16px', width: '80px' }}></div>
            <div style={{ ...skeletonStyle, height: '16px', flex: 1 }}></div>
            <div style={{ ...skeletonStyle, height: '16px', width: '120px' }}></div>
            <div style={{ ...skeletonStyle, height: '16px', width: '50px' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        <div style={{ ...skeletonStyle, height: '20px', width: '40%' }}></div>
        <div style={{ ...skeletonStyle, height: '14px', width: '100%' }}></div>
        <div style={{ ...skeletonStyle, height: '14px', width: '90%' }}></div>
        <div style={{ ...skeletonStyle, height: '14px', width: '60%' }}></div>
      </div>
    );
  }

  // Default: Card Skeleton
  return (
    <Card hoverLift={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ ...skeletonStyle, height: '40px', width: '40px', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <div style={{ ...skeletonStyle, height: '16px', width: '30%' }}></div>
            <div style={{ ...skeletonStyle, height: '12px', width: '20%' }}></div>
          </div>
        </div>
        <div style={{ ...skeletonStyle, height: '24px', width: '50%' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div style={{ ...skeletonStyle, height: '14px', width: '100%' }}></div>
          <div style={{ ...skeletonStyle, height: '14px', width: '70%' }}></div>
        </div>
      </div>
    </Card>
  );
};
export default LoadingSkeleton;
