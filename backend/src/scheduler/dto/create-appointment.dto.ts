// backend/src/scheduler/dto/create-appointment.dto.ts
import { IsUUID, IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsUUID()
  chairId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

