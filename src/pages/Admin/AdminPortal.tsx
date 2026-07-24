import React from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import Dashboard from './Dashboard';
import AIEngine from './AIEngine';
import WorkflowMonitor from './WorkflowMonitor';
import AgentMonitor from './AgentMonitor';
import HealthMonitor from './HealthMonitor';
import Metrics from './Metrics';
import AuditLogs from './AuditLogs';
import Settings from './Settings';

export const AdminPortal: React.FC = () => {
  const { currentPath } = useNavigation();

  // Route subpaths
  if (currentPath === '/admin/ai') return <AIEngine />;
  if (currentPath === '/admin/workflow' || currentPath === '/admin/workflows') return <WorkflowMonitor />;
  if (currentPath === '/admin/agents') return <AgentMonitor />;
  if (currentPath === '/admin/health') return <HealthMonitor />;
  if (currentPath === '/admin/metrics') return <Metrics />;
  if (currentPath === '/admin/audit') return <AuditLogs />;
  if (currentPath === '/admin/settings') return <Settings />;

  // Default fallback is the main Admin dashboard
  return <Dashboard />;
};
export default AdminPortal;
