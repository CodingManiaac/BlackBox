import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '', 
  id,
  ...props 
}) => {
  const inputId = id || Math.random().toString(36).substring(2, 9);
  return (
    <div className="medx-form-group">
      {label && (
        <label htmlFor={inputId} className="medx-label">
          {label}
        </label>
      )}
      <input 
        id={inputId}
        className={`medx-input ${className}`} 
        {...props}
      />
      {error && (
        <span className="medx-caption" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>
          {error}
        </span>
      )}
    </div>
  );
};
export default Input;
