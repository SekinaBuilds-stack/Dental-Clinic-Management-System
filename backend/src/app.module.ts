// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { EmrModule } from './emr/emr.module';
import { Patient } from './patients/entities/patient.entity';
import { PatientMedicalAlert } from './patients/entities/patient-medical-alert.entity';
import { Doctor } from './scheduler/entities/doctor.entity';
import { TreatmentChair } from './scheduler/entities/treatment-chair.entity';
import { Appointment } from './scheduler/entities/appointment.entity';
import { Waitlist } from './scheduler/entities/waitlist.entity';
import { Odontogram } from './emr/entities/odontogram.entity';
import { TreatmentPlan } from './emr/entities/treatment-plan.entity';
import { TreatmentPlanItem } from './emr/entities/treatment-plan-item.entity';
import { ProcedureCatalog } from './emr/entities/procedure-catalog.entity';
import { ProcedurePrice } from './emr/entities/procedure-price.entity';

@Module({
  imports: [
    // 1. Load environment variables globally from backend/.env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Configure TypeORM asynchronously using ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'dcms_user'),
        password: configService.get<string>('DB_PASSWORD', 'dcms_secure_password'),
        database: configService.get<string>('DB_NAME', 'dcms_db'),
        
        // Automatically load all entities
        entities: [
          __dirname + '/**/*.entity{.ts,.js}',
          Patient,
          PatientMedicalAlert,
          Doctor,
          TreatmentChair,
          Appointment,
          Waitlist,
          Odontogram,
          TreatmentPlan,
          TreatmentPlanItem,
          ProcedureCatalog,
          ProcedurePrice,
        ],
        
        // Keep synchronize true for development migration automation
        synchronize: true, 
        
        // Enable logging to see generated SQL queries during development
        logging: true,
      }),
    }),

    // 3. Application Feature Modules
    AuthModule,
    PatientsModule,
    SchedulerModule,
    EmrModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}