import React from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import Dashboard from './Dashboard';
import BloodInventory from './BloodInventory';
import HospitalRequests from './HospitalRequests';
import Dispatch from './Dispatch';
import ExpiryMonitoring from './ExpiryMonitoring';
import Analytics from './Analytics';
import Settings from './Settings';

export const BloodBankPortal: React.FC = () => {
  const { currentPath } = useNavigation();

  // Route subpaths
  if (currentPath === '/bloodbank/inventory') return <BloodInventory />;
  if (currentPath === '/bloodbank/requests') return <HospitalRequests />;
  if (currentPath === '/bloodbank/dispatch') return <Dispatch />;
  if (currentPath === '/bloodbank/expiry') return <ExpiryMonitoring />;
  if (currentPath === '/bloodbank/analytics') return <Analytics />;
  if (currentPath === '/bloodbank/settings') return <Settings />;

  // Default fallback is the main Blood Bank dashboard
  return <Dashboard />;
};
export default BloodBankPortal;
