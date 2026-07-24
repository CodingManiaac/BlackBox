import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearchChange?: (val: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearchChange,
  className = '',
  placeholder = 'Search...',
  ...props
}) => {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      <Search 
        size={18} 
        style={{ 
          position: 'absolute', 
          left: '12px', 
          color: 'var(--color-text-secondary)',
          pointerEvents: 'none'
        }} 
      />
      <input
        type="text"
        className={`medx-input ${className}`}
        style={{ paddingLeft: '38px', height: '40px' }}
        placeholder={placeholder}
        onChange={(e) => onSearchChange?.(e.target.value)}
        {...props}
      />
    </div>
  );
};
export default SearchBar;
