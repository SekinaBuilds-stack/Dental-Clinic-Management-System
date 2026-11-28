import { describe, it, expect, beforeEach } from 'vitest';
import { canAccess, requiredPermission } from './access';
import { setSession } from './auth';

const as = (perms: string[]) => setSession('t', 'Role', perms);

describe('role-based page access', () => {
  beforeEach(() => localStorage.clear());

  it('maps pages to the permission they need, most specific first', () => {
    expect(requiredPermission('/patients/register')).toBe('patients:create');
    expect(requiredPermission('/patients/search')).toBe('patients:read');
    expect(requiredPermission('/inventory/grn')).toBe('inventory:manage');
    expect(requiredPermission('/inventory/ledger')).toBe('inventory:read');
    expect(requiredPermission('/procurement/consumption')).toBe('inventory:consume');
    expect(requiredPermission('/procurement/requisitions')).toBe('inventory:manage');
    expect(requiredPermission('/admin/users')).toBe('admin:users');
    expect(requiredPermission('/')).toBeNull();
    expect(requiredPermission('/notifications')).toBeNull();
  });

  it('lets a receptionist in to patients but not to clinical records or user management', () => {
    as(['patients:read', 'patients:create', 'billing:read']);
    expect(canAccess('/patients')).toBe(true);
    expect(canAccess('/patients/register')).toBe(true);
    expect(canAccess('/emr/odontogram')).toBe(false);
    expect(canAccess('/admin/users')).toBe(false);
  });

  it('lets everybody see the dashboard and notifications', () => {
    as([]);
    expect(canAccess('/')).toBe(true);
    expect(canAccess('/notifications')).toBe(true);
    expect(canAccess('/reports')).toBe(false);
  });

  it('does not match a prefix inside a longer word', () => {
    as([]);
    expect(requiredPermission('/patientsXYZ')).toBeNull();
  });
});
