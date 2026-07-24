import { NavItem, UserRole } from '../types';

export const NAVIGATION_CONFIG: Record<UserRole, NavItem[]> = {
  Patient: [
    { name: 'Dashboard', path: '/patient', icon: 'Home' },
    { name: 'Search Medicine', path: '/patient/search', icon: 'Search' },
    { name: 'Emergency Request', path: '/patient/emergency', icon: 'AlertTriangle' },
    { name: 'Orders', path: '/patient/orders', icon: 'ClipboardList' },
    { name: 'Live Tracking', path: '/patient/tracking', icon: 'Map' },
    { name: 'Blood Search', path: '/patient/blood', icon: 'Droplet' },
    { name: 'AI Assistant', path: '/patient/ai', icon: 'Bot' },
    { name: 'Settings', path: '/patient/settings', icon: 'Settings' }
  ],
  Pharmacy: [
    { name: 'Dashboard', path: '/pharmacy', icon: 'Home' },
    { name: 'Orders', path: '/pharmacy/orders', icon: 'ShoppingBag' },
    { name: 'Inventory', path: '/pharmacy/inventory', icon: 'Package' },
    { name: 'Pharmacist Verification', path: '/pharmacy/verify', icon: 'ShieldCheck' },
    { name: 'Revenue', path: '/pharmacy/revenue', icon: 'DollarSign' },
    { name: 'Analytics', path: '/pharmacy/analytics', icon: 'BarChart2' },
    { name: 'Notifications', path: '/pharmacy/notifications', icon: 'Bell' },
    { name: 'Settings', path: '/pharmacy/settings', icon: 'Settings' }
  ],
  Hospital: [
    { name: 'Dashboard', path: '/hospital', icon: 'Home' },
    { name: 'Emergency Queue', path: '/hospital/emergency', icon: 'Flame' },
    { name: 'Patients', path: '/hospital/patients', icon: 'Users' },
    { name: 'Medicine Procurement', path: '/hospital/medicine', icon: 'FileText' },
    { name: 'Blood Procurement', path: '/hospital/blood', icon: 'Droplet' },
    { name: 'Procurement Logs & Tracking', path: '/hospital/procurement-history', icon: 'Map' },
    { name: 'Resource Center', path: '/hospital/resources', icon: 'Database' },
    { name: 'Reports', path: '/hospital/reports', icon: 'Clipboard' },
    { name: 'Settings', path: '/hospital/settings', icon: 'Settings' }
  ],
  BloodBank: [
    { name: 'Dashboard', path: '/bloodbank', icon: 'Home' },
    { name: 'Blood Inventory', path: '/bloodbank/inventory', icon: 'Archive' },
    { name: 'Hospital Requests', path: '/bloodbank/requests', icon: 'Send' },
    { name: 'Dispatch', path: '/bloodbank/dispatch', icon: 'Truck' },
    { name: 'Expiry Monitoring', path: '/bloodbank/expiry', icon: 'Clock' },
    { name: 'Analytics', path: '/bloodbank/analytics', icon: 'BarChart2' },
    { name: 'Settings', path: '/bloodbank/settings', icon: 'Settings' }
  ],
  Logistics: [
    { name: 'Dashboard', path: '/logistics', icon: 'Home' },
    { name: 'Deliveries', path: '/logistics/deliveries', icon: 'MapPin' },
    { name: 'Riders', path: '/logistics/riders', icon: 'Users' },
    { name: 'Fleet', path: '/logistics/fleet', icon: 'Navigation' },
    { name: 'Drone Fleet (Future)', path: '/logistics/drones', icon: 'Cpu' },
    { name: 'Route History', path: '/logistics/routes', icon: 'Activity' },
    { name: 'Settings', path: '/logistics/settings', icon: 'Settings' }
  ],
  Admin: [
    { name: 'Overview', path: '/admin', icon: 'Home' },
    { name: 'AI Engine', path: '/admin/ai', icon: 'BrainCircuit' },
    { name: 'Workflow Monitor', path: '/admin/workflows', icon: 'GitBranch' },
    { name: 'Agent Monitor', path: '/admin/agents', icon: 'Bot' },
    { name: 'Health Monitor', path: '/admin/health', icon: 'HeartPulse' },
    { name: 'Metrics', path: '/admin/metrics', icon: 'Activity' },
    { name: 'Audit Logs', path: '/admin/audit', icon: 'FileText' },
    { name: 'Settings', path: '/admin/settings', icon: 'Settings' }
  ]
};
