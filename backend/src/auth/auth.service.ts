import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // Mock user for Day 5 testing (will be replaced by UsersService / database lookup later)
    const mockUser = {
      id: 1,
      email: 'admin@dcms.com',
      // Hash of 'Password123!' generated via bcrypt
      passwordHash: '$2b$10$xa.Rf/9ibIKYXCqFNffXTeWAooPByl0jpli8/iAcVKJuOxcJfU2Sa', 
     role: 'Clinic Manager / Admin',
 permissions: [
  // patients
  'patients:create', 'patients:read', 'patients:update',
  // scheduler
  'appointments:create', 'appointments:read', 'appointments:update', 'appointments:manage',
  'waitlist:manage',
  // clinical
  'emr:read', 'emr:write', 'lab:manage',
  // billing, payments, insurance
  'billing:read', 'billing:write', 'billing:manage',
  'payments:read', 'payments:write', 'payments:process', 'payments:reverse',
  'insurance:read', 'insurance:manage',
  // retail
  'retail:manage', 'retail:return', 'retail:pos',
  // other
  'inventory:manage', 'reports:view', 'admin:users',
],
    };

    if (email === mockUser.email) {
      const isMatch = await bcrypt.compare(pass, mockUser.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = mockUser;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, permissions: user.permissions };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}