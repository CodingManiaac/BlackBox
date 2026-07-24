import React from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import Dashboard from './Dashboard';
import SearchMedicine from './SearchMedicine';
import EmergencyRequest from './EmergencyRequest';
import Orders from './Orders';
import LiveTracking from './LiveTracking';
import BloodSearch from './BloodSearch';
import AIAssistant from './AIAssistant';
import Settings from './Settings';

export const PatientPortal: React.FC = () => {
  const { currentPath } = useNavigation();

  // Route subpaths
  if (currentPath === '/patient/search') return <SearchMedicine />;
  if (currentPath === '/patient/emergency') return <EmergencyRequest />;
  if (currentPath === '/patient/orders') return <Orders />;
  if (currentPath === '/patient/tracking') return <LiveTracking />;
  if (currentPath === '/patient/blood') return <BloodSearch />;
  if (currentPath === '/patient/ai') return <AIAssistant />;
  if (currentPath === '/patient/settings') return <Settings />;

  // Default to main patient dashboard
  return <Dashboard />;
};
export default PatientPortal;
