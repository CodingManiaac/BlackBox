import { RoleMetadata } from '../types';

export const ROLE_METADATA: Record<string, RoleMetadata> = {
  Patient: {
    role: 'Patient',
    title: 'Patient Portal',
    color: 'blue',
    icon: 'User',
    description: 'Personal health profile, medicine searching, active orders, and emergency telemetry.'
  },
  Pharmacy: {
    role: 'Pharmacy',
    title: 'Pharmacy Hub',
    color: 'teal',
    icon: 'Pill',
    description: 'Prescription inventory, order tracking, pharmacist verifications, and revenue analytics.'
  },
  Hospital: {
    role: 'Hospital',
    title: 'Clinical Command Center',
    color: 'danger',
    icon: 'Activity',
    description: 'Emergency dispatch queues, patient lists, resource coordinates, and critical care units.'
  },
  BloodBank: {
    role: 'BloodBank',
    title: 'Blood Bank Registry',
    color: 'danger',
    icon: 'Droplet',
    description: 'Blood unit supplies, hospital dispatches, donation tracking, and critical unit expiration alerts.'
  },
  Logistics: {
    role: 'Logistics',
    title: 'Logistics Telemetry',
    color: 'warning',
    icon: 'Truck',
    description: 'Delivery dispatching, rider telemetry, fleet coordinates, and active delivery routes.'
  },
  Admin: {
    role: 'Admin',
    title: 'Global Control Center',
    color: 'purple',
    icon: 'Shield',
    description: 'Workflow execution audits, AI agent coordinates, cluster resource monitors, and security logs.'
  }
};
