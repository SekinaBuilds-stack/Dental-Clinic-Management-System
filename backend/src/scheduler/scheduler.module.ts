// backend/src/scheduler/scheduler.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { SchedulerGateway } from './scheduler.gateway';
import { Appointment } from './entities/appointment.entity';
import { Doctor } from './entities/doctor.entity';
import { TreatmentChair } from './entities/treatment-chair.entity';
import { Waitlist } from './entities/waitlist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Doctor, TreatmentChair, Waitlist]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key',
    }),
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService, SchedulerGateway],
  exports: [SchedulerService, SchedulerGateway],
})
export class SchedulerModule {}