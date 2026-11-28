import { Body, Controller, Get, HttpCode, Post, Request, UnauthorizedException, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from '../users/dto/users.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const pipe = new ValidationPipe({ whitelist: true });

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly users: UsersService,
  ) {}

  /** Public sign-up. Creates a PENDING account; an administrator approves it and assigns the role. */
  @Post('register')
  async register(@Body(pipe) dto: RegisterDto) {
    await this.users.register(dto);
    return { message: 'Account created. An administrator must approve it and assign your role before you can sign in.' };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body(pipe) loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    return this.authService.login(user);
  }

  /** The current user with their role and permissions as they are right now. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: any) {
    return req.user;
  }
}
