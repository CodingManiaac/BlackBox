import React from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import Dashboard from './Dashboard';
import EmergencyQueue from './EmergencyQueue';
import Patients from './Patients';
import MedicineRequests from './MedicineRequests';
import BloodCoordination from './BloodCoordination';
import ProcurementHistory from './ProcurementHistory';
import ResourceCenter from './ResourceCenter';
import Reports from './Reports';
import Settings from './Settings';

export const HospitalPortal: React.FC = () => {
  const { currentPath } = useNavigation();

  // Route subpaths
  if (currentPath === '/hospital/emergency') return <EmergencyQueue />;
  if (currentPath === '/hospital/patients') return <Patients />;
  if (currentPath === '/hospital/medicine') return <MedicineRequests />;
  if (currentPath === '/hospital/blood') return <BloodCoordination />;
  if (currentPath === '/hospital/procurement-history') return <ProcurementHistory />;
  if (currentPath === '/hospital/resources') return <ResourceCenter />;
  if (currentPath === '/hospital/reports') return <Reports />;
  if (currentPath === '/hospital/settings') return <Settings />;

  // Default fallback is the main Hospital dashboard
  return <Dashboard />;
};
export default HospitalPortal;
