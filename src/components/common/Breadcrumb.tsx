import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigation } from '../../hooks/useNavigation';

export const Breadcrumb: React.FC = () => {
  const { currentPath, navigateTo } = useNavigation();

  // Split paths e.g. "/patient/search" -> ["", "patient", "search"]
  const pathSegments = currentPath.split('/').filter(p => p !== '');

  if (pathSegments.length === 0) return null;

  const capitalize = (s: string) => {
    // Map specific paths to custom names
    if (s.toLowerCase() === 'bloodbank') return 'Blood Bank';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <button 
        onClick={() => navigateTo('/login')}
        className="medx-caption"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontWeight: 600,
          color: 'var(--color-primary)'
        }}
      >
        MedXNet
      </button>

      {pathSegments.map((segment, idx) => {
        const path = '/' + pathSegments.slice(0, idx + 1).join('/');
        const isLast = idx === pathSegments.length - 1;

        return (
          <React.Fragment key={path}>
            <ChevronRight size={12} style={{ color: 'var(--color-text-secondary)' }} />
            <button
              onClick={() => !isLast && navigateTo(path)}
              disabled={isLast}
              className="medx-caption"
              style={{
                background: 'none',
                border: 'none',
                cursor: isLast ? 'default' : 'pointer',
                padding: 0,
                fontWeight: isLast ? 500 : 600,
                color: isLast ? 'var(--color-text-secondary)' : 'var(--color-primary)'
              }}
            >
              {capitalize(segment)}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
export default Breadcrumb;
