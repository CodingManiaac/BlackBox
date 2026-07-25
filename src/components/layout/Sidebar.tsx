import React from 'react';
import * as Icons from 'lucide-react';
import { useNavigation } from '../../hooks/useNavigation';
import { NAVIGATION_CONFIG } from '../../config/navigation';
import { UserRole } from '../../types';

interface SidebarProps {
  role: UserRole;
  collapsed?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, collapsed = false, onCloseMobile }) => {
  const { currentPath, navigateTo } = useNavigation();
  const navItems = NAVIGATION_CONFIG[role] || [];

  const [userName, setUserName] = React.useState(() => {
    const session = localStorage.getItem('medx_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.name || parsed.username || 'User';
      } catch (e) {}
    }
    return 'User';
  });

  React.useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && e.detail.name) {
        setUserName(e.detail.name);
      } else {
        const session = localStorage.getItem('medx_session');
        if (session) {
          try {
            const parsed = JSON.parse(session);
            setUserName(parsed.name || parsed.username || 'User');
          } catch (err) {}
        }
      }
    };
    window.addEventListener('patient-profile-updated', handleUpdate);
    return () => window.removeEventListener('patient-profile-updated', handleUpdate);
  }, []);

  const handleNavClick = (path: string) => {
    navigateTo(path);
    if (onCloseMobile) onCloseMobile();
  };

  // Helper to render Lucide Icons dynamically
  const renderIcon = (iconName: string, active: boolean) => {
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return (
      <IconComponent 
        size={18} 
        style={{
          color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          transition: 'color var(--transition-speed) var(--transition-ease)'
        }}
      />
    );
  };

  return (
    <div style={{
      width: collapsed ? '80px' : '260px',
      backgroundColor: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width var(--transition-speed) var(--transition-ease)'
    }}>
      {/* Sidebar Logo Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        height: '70px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary)',
          flexShrink: 0
        }}>
          <Icons.HeartPulse size={18} />
        </div>
        {!collapsed && (
          <div style={{ whiteSpace: 'nowrap' }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
              lineHeight: 1.1
            }}>
              MedXNet
            </h2>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Core Shell
            </span>
          </div>
        )}
      </div>

      {/* Navigation Body */}
      <nav style={{
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
        overflowY: 'auto'
      }}>
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                width: '100%',
                height: '40px',
                padding: collapsed ? '0' : '0 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--color-primary-soft)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all var(--transition-speed) var(--transition-ease)',
                position: 'relative'
              }}
              className="medx-button-ghost"
              title={collapsed ? item.name : undefined}
            >
              {renderIcon(item.icon, isActive)}
              {!collapsed && (
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.name}
                </span>
              )}
              {/* Highlight bar */}
              {isActive && !collapsed && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '8px',
                  bottom: '8px',
                  width: '3px',
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: '0 4px 4px 0'
                }}></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
export default Sidebar;
