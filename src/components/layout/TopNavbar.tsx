import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useNavigation } from '../../hooks/useNavigation';
import { UserRole } from '../../types';

interface TopNavbarProps {
  role: UserRole;
  title: string;
  onMenuToggle: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ role, title, onMenuToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const { navigateTo } = useNavigation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const session = localStorage.getItem('medx_session');
      let patientId = 'PAT-001';
      if (session) {
        const parsed = JSON.parse(session);
        patientId = parsed.associatedId || 'PAT-001';
      }
      const res = await fetch(`http://localhost:3001/api/patients/${patientId}/notifications`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NOTIFICATION_RECEIVED' || data.type === 'STAGE_CHANGED') {
          fetchNotifications();
        }
      } catch (e) {}
    };

    return () => eventSource.close();
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
    const nextTheme = theme === 'light' ? 'Dark' : 'Light';
    addToast(`Theme switched to ${nextTheme} Mode.`, 'info');
  };

  const handleLogout = () => {
    addToast('Successfully signed out.', 'success');
    navigateTo('/login');
  };

  return (
    <header style={{
      height: '70px',
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 99
    }}>
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onMenuToggle}
          className="medx-button medx-button-ghost"
          style={{
            width: '40px',
            height: '40px',
            padding: 0,
            borderRadius: '8px',
            display: 'inline-flex'
          }}
          aria-label="Toggle Navigation Sidebar"
        >
          <Icons.Menu size={20} />
        </button>

        <div>
          <h1 className="medx-card-title" style={{ fontSize: '18px', margin: 0 }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Notifications Icon with Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="medx-button medx-button-ghost"
            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', position: 'relative' }}
          >
            <Icons.Bell size={18} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                backgroundColor: 'var(--color-danger)',
                width: '8px',
                height: '8px',
                borderRadius: '50%'
              }}></span>
            )}
          </button>

          {notificationsOpen && (
            <div 
              className="medx-scale-in shadow-md"
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '320px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '16px',
                zIndex: 100
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span className="medx-caption" style={{ fontWeight: 700 }}>Notifications</span>
                <span className="medx-caption" style={{ color: 'var(--color-primary)', cursor: 'pointer' }} onClick={async () => {
                  try {
                    const session = localStorage.getItem('medx_session');
                    let patientId = 'PAT-001';
                    if (session) {
                      const parsed = JSON.parse(session);
                      patientId = parsed.associatedId || 'PAT-001';
                    }
                    await fetch(`http://localhost:3001/api/patients/${patientId}/notifications`, { method: 'DELETE' });
                    addToast('Cleared all notifications.', 'success');
                    fetchNotifications();
                  } catch (e) {}
                }}>Clear</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                {notifications.length === 0 ? (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((not: any) => (
                    <div key={not.id} style={{ fontSize: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{not.message}</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                        {new Date(not.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }}></div>

        {/* Profile Menu Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="medx-button medx-button-ghost"
            style={{
              padding: '4px 8px',
              height: '40px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)'
            }}>
              <Icons.User size={14} />
            </div>
            <span className="medx-caption" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Vishu Kumar
            </span>
            <Icons.ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
          </button>

          {profileOpen && (
            <div
              className="medx-scale-in shadow-md"
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '220px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '8px 0',
                zIndex: 100
              }}
            >
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Vishu Kumar</div>
                <div className="medx-caption" style={{ fontSize: '11px' }}>Active Role: {role}</div>
              </div>



              {/* Signout */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Icons.LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
export default TopNavbar;
