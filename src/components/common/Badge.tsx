import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'info', 
  children, 
  className = '', 
  ...props 
}) => {
  const variantClass = `medx-badge-${variant}`;
  return (
    <span 
      className={`medx-badge ${variantClass} ${className}`} 
      {...props}
    >
      <span className="medx-badge-dot"></span>
      {children}
    </span>
  );
};
export default Badge;
