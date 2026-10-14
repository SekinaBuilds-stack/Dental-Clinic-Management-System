// backend/src/scheduler/scheduler.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { Appointment } from './entities/appointment.entity';
import { Doctor } from './entities/doctor.entity';
import { TreatmentChair } from './entities/treatment-chair.entity';
import { Waitlist } from './entities/waitlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Doctor, TreatmentChair, Waitlist])],
  controllers: [SchedulerController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}