export type UserRole = 'Patient' | 'Pharmacy' | 'Hospital' | 'BloodBank' | 'Logistics' | 'Admin';

export interface NavItem {
  name: string;
  path: string;
  icon: string; // Dynamic icon string key used for rendering generic Lucide icons
}

export interface RoleMetadata {
  role: UserRole;
  title: string;
  color: 'blue' | 'teal' | 'success' | 'warning' | 'danger' | 'purple';
  icon: string;
  description: string;
}

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export type ThemeMode = 'light' | 'dark';
