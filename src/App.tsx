import React from 'react';
import { NavigationProvider } from './context/NavigationContext';
import { useNavigation } from './hooks/useNavigation';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/login/LoginPage';
import PatientPortal from './pages/Patient/PatientPortal';
import PharmacyPortal from './pages/Pharmacy/PharmacyPortal';
import HospitalPortal from './pages/Hospital/HospitalPortal';
import BloodBankPortal from './pages/BloodBank/BloodBankPortal';
import LogisticsPortal from './pages/Logistics/LogisticsPortal';
import AdminPortal from './pages/Admin/AdminPortal';
import DashboardLayout from './components/layout/DashboardLayout';

const MainApp: React.FC = () => {
  const { currentPath } = useNavigation();

  // Simple path routing rules matching each role workspace
  if (currentPath.startsWith('/patient')) {
    return (
      <DashboardLayout role="Patient">
        <PatientPortal />
      </DashboardLayout>
    );
  }

  if (currentPath.startsWith('/pharmacy')) {
    return (
      <DashboardLayout role="Pharmacy">
        <PharmacyPortal />
      </DashboardLayout>
    );
  }

  if (currentPath.startsWith('/hospital')) {
    return (
      <DashboardLayout role="Hospital">
        <HospitalPortal />
      </DashboardLayout>
    );
  }

  if (currentPath.startsWith('/bloodbank')) {
    return (
      <DashboardLayout role="BloodBank">
        <BloodBankPortal />
      </DashboardLayout>
    );
  }

  if (currentPath.startsWith('/logistics')) {
    return (
      <DashboardLayout role="Logistics">
        <LogisticsPortal />
      </DashboardLayout>
    );
  }

  if (currentPath.startsWith('/admin')) {
    return (
      <DashboardLayout role="Admin">
        <AdminPortal />
      </DashboardLayout>
    );
  }

  // Default fallback is the Simulated Login Portal
  return <LoginPage />;
};

export default function App() {
  return (
    <NavigationProvider>
      <ThemeProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </ThemeProvider>
    </NavigationProvider>
  );
}
