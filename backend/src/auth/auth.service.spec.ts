import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService (FR-CORE-001)', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'usr-001',
    email: 'admin@dcms.com',
    passwordHash: '$2b$10$hashedPasswordValue',
    role: { name: 'Admin', permissions: ['*'] },
  };

  const mockUsersService = {
    findByEmail: jest.fn<() => Promise<typeof mockUser>>(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UsersService', useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should return JWT token on valid credentials', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
    mockUsersService.findByEmail.mockResolvedValue(mockUser);

    const result = await service.login({ email: 'admin@dcms.com', password: 'Password123!' });

    expect(result).toHaveProperty('accessToken');
    expect(result.accessToken).toBe('mocked-jwt-token');
  });

  it('should throw UnauthorizedException on invalid password', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
    mockUsersService.findByEmail.mockResolvedValue(mockUser);

    await expect(
      service.login({ email: 'admin@dcms.com', password: 'WrongPassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});