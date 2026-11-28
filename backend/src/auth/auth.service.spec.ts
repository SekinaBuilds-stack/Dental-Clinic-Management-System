import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwt: { sign: ReturnType<typeof vi.fn> };
  let users: any;

  const active = { id: 'u1', email: 'a@x.com', role: 'Cashier / Billing Officer', status: 'ACTIVE' };

  beforeEach(() => {
    jwt = { sign: vi.fn(() => 'signed-token') };
    users = {
      verifyPassword: vi.fn(),
      touchLogin: vi.fn(async () => undefined),
      toSafe: vi.fn((u: any) => ({ ...u, permissions: ['billing:read'] })),
    };
    service = new AuthService(jwt as any, users);
  });

  it('delegates the password check to the users service', async () => {
    users.verifyPassword.mockResolvedValue(active);
    await expect(service.validateUser('a@x.com', 'pw')).resolves.toBe(active);
    users.verifyPassword.mockResolvedValue(null);
    await expect(service.validateUser('a@x.com', 'bad')).resolves.toBeNull();
  });

  it('signs a token and returns the user with permissions for an active account', async () => {
    const result = await service.login(active as any);
    expect(jwt.sign).toHaveBeenCalledWith({ email: 'a@x.com', sub: 'u1', role: 'Cashier / Billing Officer' });
    expect(result.accessToken).toBe('signed-token');
    expect(result.user.permissions).toEqual(['billing:read']);
    expect(users.touchLogin).toHaveBeenCalled();
  });

  it('refuses to sign in a pending account', async () => {
    await expect(service.login({ ...active, status: 'PENDING', role: null } as any)).rejects.toThrow(/waiting for approval/);
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('refuses to sign in a deactivated account', async () => {
    await expect(service.login({ ...active, status: 'DEACTIVATED' } as any)).rejects.toThrow(ForbiddenException);
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});
