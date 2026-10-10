// backend/src/patients/patients.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { PatientMedicalAlert } from './entities/patient-medical-alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, PatientMedicalAlert])],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}