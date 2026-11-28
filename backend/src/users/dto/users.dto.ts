import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { ROLES } from '../roles.config';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Please enter your full name' })
  @MaxLength(120)
  fullName: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72)
  password: string;
}

export class ApproveUserDto {
  @IsIn([...ROLES], { message: 'role must be one of the clinic roles' })
  role: string;
}

export class SetStatusDto {
  @IsIn(['ACTIVE', 'DEACTIVATED'])
  status: 'ACTIVE' | 'DEACTIVATED';
}

export class CreateUserDto extends RegisterDto {
  @IsIn([...ROLES], { message: 'role must be one of the clinic roles' })
  role: string;
}
