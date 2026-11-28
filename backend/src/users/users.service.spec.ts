import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { ADMIN_ROLE, ALL_PERMISSIONS, ROLES, ROLE_PERMISSIONS, permissionsFor } from './roles.config';

const ID = '11111111-1111-1111-1111-111111111111';
const ADMIN_ID = '22222222-2222-2222-2222-222222222222';

describe('UsersService', () => {
  let service: UsersService;
  let repo: any;

  beforeEach(() => {
    repo = {
      findOne: vi.fn(),
      find: vi.fn(async () => []),
      count: vi.fn(async () => 2),
      create: vi.fn((x: any) => ({ ...x })),
      save: vi.fn(async (x: any) => ({ id: ID, createdAt: new Date(), ...x })),
    };
    service = new UsersService(repo, { get: (_k: string, d: string) => d } as any);
  });

  it('registers a PENDING user with no role and a hashed password', async () => {
    repo.findOne.mockResolvedValue(null);
    const user = await service.register({ fullName: ' Jane Doe ', email: 'Jane@Clinic.com', password: 'secret123' });
    const saved = repo.create.mock.calls[0][0];
    expect(saved).toMatchObject({ email: 'jane@clinic.com', fullName: 'Jane Doe', role: null, status: 'PENDING' });
    expect(saved.passwordHash).not.toBe('secret123');
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$/);
    expect((user as any).passwordHash).toBeUndefined();
    expect(user.permissions).toEqual([]);
  });

  it('rejects a duplicate email', async () => {
    repo.findOne.mockResolvedValue({ id: ID });
    await expect(service.register({ fullName: 'A B', email: 'a@b.com', password: 'secret123' })).rejects.toThrow(ConflictException);
  });

  it('approves a user: sets the role, activates, records who approved', async () => {
    repo.findOne.mockResolvedValue({ id: ID, status: 'PENDING', role: null });
    const user = await service.approve(ID, 'Cashier / Billing Officer', ADMIN_ID);
    expect(user).toMatchObject({ status: 'ACTIVE', role: 'Cashier / Billing Officer', approvedBy: ADMIN_ID });
    expect(user.permissions).toContain('payments:write');
  });

  it('rejects an unknown role and an unknown user', async () => {
    await expect(service.approve(ID, 'Wizard', ADMIN_ID)).rejects.toThrow(BadRequestException);
    repo.findOne.mockResolvedValue(null);
    await expect(service.approve(ID, 'Lab Coordinator', ADMIN_ID)).rejects.toThrow(NotFoundException);
    await expect(service.approve('not-a-uuid', 'Lab Coordinator', ADMIN_ID)).rejects.toThrow(NotFoundException);
  });

  it('cannot change the role of a pending account (approve it instead)', async () => {
    repo.findOne.mockResolvedValue({ id: ID, status: 'PENDING', role: null });
    await expect(service.setRole(ID, 'Lab Coordinator', ADMIN_ID)).rejects.toThrow(/Approve this account first/);
  });

  it('stops an admin deactivating or demoting themselves', async () => {
    repo.findOne.mockResolvedValue({ id: ADMIN_ID, status: 'ACTIVE', role: ADMIN_ROLE });
    await expect(service.setStatus(ADMIN_ID, 'DEACTIVATED', ADMIN_ID)).rejects.toThrow(/own administrator/);
    await expect(service.setRole(ADMIN_ID, 'Lab Coordinator', ADMIN_ID)).rejects.toThrow(/own administrator/);
  });

  it('keeps at least one active administrator', async () => {
    repo.findOne.mockResolvedValue({ id: ID, status: 'ACTIVE', role: ADMIN_ROLE });
    repo.count.mockResolvedValue(1);
    await expect(service.setStatus(ID, 'DEACTIVATED', ADMIN_ID)).rejects.toThrow(/at least one active administrator/);
  });

  it('will not activate an account that has no role', async () => {
    repo.findOne.mockResolvedValue({ id: ID, status: 'DEACTIVATED', role: null });
    await expect(service.setStatus(ID, 'ACTIVE', ADMIN_ID)).rejects.toThrow(/Assign a role/);
  });
});

describe('role permissions (SRS section 4)', () => {
  it('has all 8 roles, each with a permission list', () => {
    expect(ROLES).toHaveLength(8);
    for (const r of ROLES) expect(ROLE_PERMISSIONS[r].length).toBeGreaterThan(0);
  });
  it('only uses permissions that exist', () => {
    for (const r of ROLES) for (const p of ROLE_PERMISSIONS[r]) expect(ALL_PERMISSIONS).toContain(p);
  });
  it('gives the administrator everything', () => {
    expect(permissionsFor(ADMIN_ROLE)).toEqual([...ALL_PERMISSIONS]);
  });
  it('keeps clinical records away from the front desk and cashier', () => {
    for (const role of ['Receptionist / Front Desk', 'Cashier / Billing Officer']) {
      const p = permissionsFor(role);
      expect(p.some((x) => x.startsWith('emr:') || x.startsWith('lab:'))).toBe(false);
    }
  });
  it('only the administrator manages users and reads the audit log', () => {
    for (const r of ROLES.filter((r) => r !== ADMIN_ROLE)) {
      expect(permissionsFor(r)).not.toContain('admin:users');
      expect(permissionsFor(r)).not.toContain('audit:view');
    }
  });
  it('gives nothing to an unknown or empty role', () => {
    expect(permissionsFor(null)).toEqual([]);
    expect(permissionsFor('Hacker')).toEqual([]);
  });
});
