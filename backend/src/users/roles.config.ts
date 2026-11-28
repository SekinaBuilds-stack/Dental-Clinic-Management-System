// The 8 roles from the SRS (section 4) and what each may do.
// A "permission" is the string a controller asks for with @RequirePermissions('...').

export const ROLES = [
  'Clinic Manager / Admin',
  'Dentist / Doctor',
  'Dental Assistant / Hygienist',
  'Receptionist / Front Desk',
  'Cashier / Billing Officer',
  'Insurance Coordinator',
  'Inventory / Store Officer',
  'Lab Coordinator',
] as const;
export type RoleName = (typeof ROLES)[number];

export const ADMIN_ROLE: RoleName = 'Clinic Manager / Admin';

export const ALL_PERMISSIONS = [
  'patients:create', 'patients:read', 'patients:update',
  'appointments:create', 'appointments:read', 'appointments:update', 'waitlist:manage',
  'emr:read', 'emr:write', 'lab:manage',
  'billing:read', 'billing:write',
  'payments:read', 'payments:write', 'payments:reverse',
  'insurance:read', 'insurance:manage',
  'retail:manage', 'retail:return',
  'inventory:read', 'inventory:manage', 'inventory:consume',
  'reports:view', 'audit:view',
  'admin:users',
] as const;

export const ROLE_PERMISSIONS: Record<RoleName, readonly string[]> = {
  'Clinic Manager / Admin': ALL_PERMISSIONS,

  'Dentist / Doctor': [
    'patients:read', 'appointments:read', 'appointments:create', 'appointments:update',
    'emr:read', 'emr:write', 'lab:manage',
    'billing:read',
    'inventory:read', 'inventory:consume',
  ],

  'Dental Assistant / Hygienist': [
    'patients:read', 'appointments:read',
    'emr:read', 'emr:write',
    'inventory:read', 'inventory:consume',
  ],

  // "no clinical detail access": deliberately no emr:* and no lab:*
  'Receptionist / Front Desk': [
    'patients:create', 'patients:read', 'patients:update',
    'appointments:create', 'appointments:read', 'appointments:update', 'waitlist:manage',
    'billing:read', 'billing:write',
    'retail:manage', 'retail:return',
  ],

  'Cashier / Billing Officer': [
    'patients:read',
    'billing:read', 'billing:write',
    'payments:read', 'payments:write', 'payments:reverse',
    'reports:view',
  ],

  'Insurance Coordinator': [
    'patients:read',
    'billing:read',
    'payments:read',
    'insurance:read', 'insurance:manage',
  ],

  'Inventory / Store Officer': [
    'inventory:read', 'inventory:manage', 'inventory:consume',
    'reports:view',
  ],

  'Lab Coordinator': ['patients:read', 'emr:read', 'lab:manage'],
};

export function isRole(value: unknown): value is RoleName {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Permissions for a role name; an unknown or empty role gets nothing. */
export function permissionsFor(role: string | null | undefined): string[] {
  return isRole(role) ? [...ROLE_PERMISSIONS[role]] : [];
}
