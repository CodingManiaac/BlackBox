import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
  shadow?: 'xs' | 'sm' | 'md';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  hoverLift = true, 
  shadow = 'sm', 
  children, 
  className = '', 
  style,
  ...props 
}) => {
  const shadowClass = `shadow-${shadow}`;
  const hoverClass = hoverLift ? 'medx-card' : '';
  
  return (
    <div 
      className={`${hoverClass || 'medx-card-static'} ${shadowClass} ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        padding: '24px',
        transition: 'transform var(--transition-speed) var(--transition-ease), box-shadow var(--transition-speed) var(--transition-ease)',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;
