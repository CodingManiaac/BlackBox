import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import Drawer from '../common/Drawer';
import PageTransition from '../common/PageTransition';
import { useNavigation } from '../../hooks/useNavigation';
import { ROLE_METADATA } from '../../config/roleConfig';
import { UserRole } from '../../types';

interface DashboardLayoutProps {
  role: UserRole;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role, children }) => {
  const { currentPath } = useNavigation();
  const metadata = ROLE_METADATA[role] || { title: 'Dashboard', role: role, description: '' };

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      // Auto collapse on tablet sizes
      if (width >= 768 && width < 1024) {
        setSidebarCollapsed(true);
      } else if (width >= 1024) {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial call
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = windowWidth < 768;

  const handleMenuToggle = () => {
    if (isMobile) {
      setMobileDrawerOpen(!mobileDrawerOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* 1. Sidebar - Hidden on mobile, collapsible on tablet/desktop */}
      {!isMobile && (
        <aside style={{ height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}>
          <Sidebar role={role} collapsed={sidebarCollapsed} />
        </aside>
      )}

      {/* 2. Main panel container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Header navigation */}
        <TopNavbar 
          role={role} 
          title={metadata.title} 
          onMenuToggle={handleMenuToggle} 
        />

        {/* Content body offset with transition */}
        <main style={{
          flex: 1,
          padding: isMobile ? '24px 16px' : '40px',
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto'
        }}>
          <PageTransition routeKey={currentPath}>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* 3. Mobile sidebar drawer container */}
      {isMobile && (
        <Drawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          title="MedXNet Navigation"
          position="left"
        >
          <div style={{ height: '100%', margin: '-24px' }}>
            <Sidebar 
              role={role} 
              collapsed={false} 
              onCloseMobile={() => setMobileDrawerOpen(false)} 
            />
          </div>
        </Drawer>
      )}
    </div>
  );
};
export default DashboardLayout;
