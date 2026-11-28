import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { ADMIN_ROLE, isRole, permissionsFor } from './roles.config';

export type SafeUser = Omit<User, 'passwordHash'> & { permissions: string[] };

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly log = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  /** Make sure there is always one administrator who can approve everyone else. */
  async onModuleInit() {
    const email = this.config.get<string>('ADMIN_EMAIL', 'admin@dcms.com').toLowerCase();
    if (await this.repo.findOne({ where: { email } })) return;
    const password = this.config.get<string>('ADMIN_PASSWORD', 'Password123!');
    try {
      await this.repo.save(
        this.repo.create({
          email,
          fullName: 'System Administrator',
          passwordHash: await bcrypt.hash(password, 10),
          role: ADMIN_ROLE,
          status: 'ACTIVE',
        }),
      );
      this.log.warn(`Created the initial administrator ${email}. Change its password.`);
    } catch (e) {
      // Two processes starting together can both try to create it; the second one loses harmlessly.
      if ((e as { code?: string }).code !== '23505') throw e;
    }
  }

  toSafe(user: User): SafeUser {
    const { passwordHash: _omit, ...rest } = user;
    void _omit;
    return { ...rest, permissions: user.status === 'ACTIVE' ? permissionsFor(user.role) : [] };
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email: String(email).trim().toLowerCase() } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  /** Public sign-up. The account starts PENDING with no role. */
  async register(dto: { fullName: string; email: string; password: string }) {
    const email = dto.email.trim().toLowerCase();
    if (await this.findByEmail(email)) throw new ConflictException('An account with this email already exists');
    const user = await this.repo.save(
      this.repo.create({
        email,
        fullName: dto.fullName.trim(),
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: null,
        status: 'PENDING',
      }),
    );
    return this.toSafe(user);
  }

  /** Returns the user when the password matches (whatever the status), otherwise null. */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    return (await bcrypt.compare(password, user.passwordHash)) ? user : null;
  }

  async touchLogin(user: User) {
    user.lastLoginAt = new Date();
    await this.repo.save(user);
  }

  async list(status?: string) {
    const where = status && ['PENDING', 'ACTIVE', 'DEACTIVATED'].includes(status) ? { status: status as UserStatus } : {};
    const users = await this.repo.find({ where, order: { createdAt: 'DESC' } });
    return users.map((u) => this.toSafe(u));
  }

  /** Admin creates a ready-to-use account. */
  async createByAdmin(dto: { fullName: string; email: string; password: string; role: string }, adminId: string) {
    if (!isRole(dto.role)) throw new BadRequestException('Unknown role');
    const created = await this.register(dto);
    return this.approve(created.id, dto.role, adminId);
  }

  async approve(id: string, role: string, adminId: string) {
    if (!isRole(role)) throw new BadRequestException('Unknown role');
    const user = await this.mustFind(id);
    user.role = role;
    user.status = 'ACTIVE';
    user.approvedBy = adminId;
    return this.toSafe(await this.repo.save(user));
  }

  async setRole(id: string, role: string, adminId: string) {
    if (!isRole(role)) throw new BadRequestException('Unknown role');
    const user = await this.mustFind(id);
    if (user.status === 'PENDING') throw new BadRequestException('Approve this account first');
    if (user.role === ADMIN_ROLE && role !== ADMIN_ROLE) await this.guardAdminLoss(user, adminId);
    user.role = role;
    return this.toSafe(await this.repo.save(user));
  }

  async setStatus(id: string, status: 'ACTIVE' | 'DEACTIVATED', adminId: string) {
    const user = await this.mustFind(id);
    if (status === 'ACTIVE' && !user.role) throw new BadRequestException('Assign a role before activating this account');
    if (status === 'DEACTIVATED') await this.guardAdminLoss(user, adminId);
    user.status = status;
    return this.toSafe(await this.repo.save(user));
  }

  /** Stops an administrator locking themselves (or everyone) out. */
  private async guardAdminLoss(user: User, adminId: string) {
    if (user.id === adminId) throw new BadRequestException('You cannot remove your own administrator access');
    if (user.role === ADMIN_ROLE && user.status === 'ACTIVE') {
      const admins = await this.repo.count({ where: { role: ADMIN_ROLE, status: 'ACTIVE' } });
      if (admins <= 1) throw new BadRequestException('There must be at least one active administrator');
    }
  }

  private async mustFind(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NotFoundException('User not found');
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
