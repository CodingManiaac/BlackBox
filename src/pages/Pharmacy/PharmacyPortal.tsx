import React from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import Dashboard from './Dashboard';
import Orders from './Orders';
import Inventory from './Inventory';
import PharmacistVerification from './PharmacistVerification';
import Revenue from './Revenue';
import Analytics from './Analytics';
import Notifications from './Notifications';
import Settings from './Settings';

export const PharmacyPortal: React.FC = () => {
  const { currentPath } = useNavigation();

  // Route subpaths
  if (currentPath === '/pharmacy/orders') return <Orders />;
  if (currentPath === '/pharmacy/inventory') return <Inventory />;
  if (currentPath === '/pharmacy/verify') return <PharmacistVerification />;
  if (currentPath === '/pharmacy/revenue') return <Revenue />;
  if (currentPath === '/pharmacy/analytics') return <Analytics />;
  if (currentPath === '/pharmacy/notifications') return <Notifications />;
  if (currentPath === '/pharmacy/settings') return <Settings />;

  // Default fallback is the main Pharmacy dashboard
  return <Dashboard />;
};
export default PharmacyPortal;
