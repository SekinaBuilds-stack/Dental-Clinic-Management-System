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
      // Hash of 'Admin123!' generated via bcrypt
      passwordHash: '$2b$10$EpV9Xq0SUv7K1g9tD4e02O3P1dZ1U9n5sF0vWb2lG1X7b9f3C9t9i', 
      role: 'Clinic Manager',
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
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}