import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService (FR-CORE-001)', () => {
  let service: AuthService;
  const mockJwtService = {
    sign: vi.fn().mockReturnValue('mocked-jwt-token'),
  };

  beforeEach(() => {
    mockJwtService.sign.mockClear();
    service = new AuthService(mockJwtService as unknown as JwtService);
  });

  it('validateUser returns the user (without passwordHash) on valid credentials', async () => {
    const user = await service.validateUser('admin@dcms.com', 'Password123!');

    expect(user).not.toBeNull();
    expect(user.email).toBe('admin@dcms.com');
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('validateUser returns null on a wrong password', async () => {
    const user = await service.validateUser('admin@dcms.com', 'WrongPassword');
    expect(user).toBeNull();
  });

  it('validateUser returns null for an unknown email', async () => {
    const user = await service.validateUser('nobody@dcms.com', 'Password123!');
    expect(user).toBeNull();
  });

  it('login returns an access token and embeds role and permissions in the payload', async () => {
    const user = { id: 1, email: 'admin@dcms.com', role: 'Clinic Manager / Admin', permissions: ['patients:read'] };

    const result = await service.login(user);

    expect(result.accessToken).toBe('mocked-jwt-token');
    expect(mockJwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 1, email: 'admin@dcms.com', permissions: ['patients:read'] }),
    );
  });
});