// backend/src/scheduler/dto/create-waitlist.dto.ts
import { IsUUID, IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateWaitlistDto {
  @IsUUID()
  patientId: string;

  @IsDateString()
  preferredDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}