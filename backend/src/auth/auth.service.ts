import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly users: UsersService,
  ) {}

  /** Checks the password only. Returns the user record (any status) or null. */
  validateUser(email: string, pass: string) {
    return this.users.verifyPassword(email, pass);
  }

  /** Issues a token, but only for approved, active accounts. */
  async login(user: NonNullable<Awaited<ReturnType<UsersService['verifyPassword']>>>) {
    if (user.status === 'PENDING') {
      throw new ForbiddenException('Your account is waiting for approval. An administrator must assign you a role first.');
    }
    if (user.status === 'DEACTIVATED') {
      throw new ForbiddenException('This account has been deactivated. Please contact the clinic administrator.');
    }
    await this.users.touchLogin(user);
    const safe = this.users.toSafe(user);
    const payload = { email: user.email, sub: user.id, role: user.role };
    return { accessToken: this.jwtService.sign(payload), user: safe };
  }
}
