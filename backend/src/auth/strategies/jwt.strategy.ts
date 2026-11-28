import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { permissionsFor } from '../../users/roles.config';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'SUPER_SECRET_DCMS_KEY'),
    });
  }

  /**
   * Runs on every request. The role and permissions are read from the database, not from the
   * token, so an administrator's change (new role, deactivation) takes effect immediately.
   */
  async validate(payload: { sub?: string }) {
    if (!payload?.sub || !UUID.test(payload.sub)) throw new UnauthorizedException();
    const user = await this.users.findById(payload.sub);
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException();
    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      permissions: permissionsFor(user.role),
    };
  }
}
