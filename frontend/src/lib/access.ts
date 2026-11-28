import { can } from './auth';

// Which permission each part of the app needs. The first matching rule wins,
// so the specific paths come before the general ones. The backend enforces the same
// permissions; this only decides what the menu shows and which pages open.
const RULES: [string, string][] = [
  ['/patients/register', 'patients:create'],
  ['/patients', 'patients:read'],
  ['/scheduler', 'appointments:read'],
  ['/emr', 'emr:read'],
  ['/billing', 'billing:read'],
  ['/payments/insurance', 'insurance:read'],
  ['/payments/reversals', 'payments:reverse'],
  ['/payments', 'payments:write'],
  ['/inventory/grn', 'inventory:manage'],
  ['/inventory', 'inventory:read'],
  ['/procurement/consumption', 'inventory:consume'],
  ['/procurement', 'inventory:manage'],
  ['/retail', 'retail:manage'],
  ['/reports', 'reports:view'],
  ['/audit', 'audit:view'],
  ['/admin', 'admin:users'],
];

export function requiredPermission(path: string): string | null {
  const hit = RULES.find(([prefix]) => path === prefix || path.startsWith(prefix + '/'));
  return hit ? hit[1] : null;
}

export function canAccess(path: string): boolean {
  const need = requiredPermission(path);
  return need === null || can(need);
}
