// backend/src/patients/dto/create-patient.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MedicalAlertDto {
  @IsString()
  @IsNotEmpty()
  alertType: string;

  @IsString()
  @IsNotEmpty()
  severity: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  referralSource?: string;

  @IsBoolean()
  @IsOptional()
  isPreRegistered?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalAlertDto)
  @IsOptional()
  medicalAlerts?: MedicalAlertDto[];
}