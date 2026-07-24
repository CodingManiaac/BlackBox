import React from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import Dashboard from './Dashboard';
import Deliveries from './Deliveries';
import Riders from './Riders';
import Fleet from './Fleet';
import DroneFleet from './DroneFleet';
import RouteHistory from './RouteHistory';
import Settings from './Settings';

export const LogisticsPortal: React.FC = () => {
  const { currentPath } = useNavigation();

  // Route subpaths
  if (currentPath === '/logistics/deliveries') return <Deliveries />;
  if (currentPath === '/logistics/riders') return <Riders />;
  if (currentPath === '/logistics/fleet') return <Fleet />;
  if (currentPath === '/logistics/drones') return <DroneFleet />;
  if (currentPath === '/logistics/routes') return <RouteHistory />;
  if (currentPath === '/logistics/settings') return <Settings />;

  // Default fallback is the main Logistics dashboard
  return <Dashboard />;
};
export default LogisticsPortal;
