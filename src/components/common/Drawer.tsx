import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  position?: 'left' | 'right';
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  position = 'right', 
  children 
}) => {
  if (!isOpen) return null;

  const isLeft = position === 'left';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(17, 24, 39, 0.4)',
      backdropFilter: 'blur(1px)',
      zIndex: 9999
    }}>
      {/* Drawer content pane */}
      <div 
        className="medx-slide-in shadow-md"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: isLeft ? 0 : 'auto',
          right: isLeft ? 'auto' : 0,
          width: '100%',
          maxWidth: '380px',
          backgroundColor: 'var(--color-surface)',
          borderLeft: isLeft ? 'none' : '1px solid var(--color-border)',
          borderRight: isLeft ? '1px solid var(--color-border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          animation: 'fadeIn 150ms ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 className="medx-card-title">{title}</h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }} className="medx-body">
          {children}
        </div>
      </div>
    </div>
  );
};
export default Drawer;
