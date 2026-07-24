import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const variantClass = `medx-button-${variant}`;
  return (
    <button 
      className={`medx-button ${variantClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
export default Button;
