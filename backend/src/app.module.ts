// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature & Utility Modules
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { EmrModule } from './emr/emr.module';
import { BillingModule } from './billing/billing.module';
import { PaymentsModule } from './payments/payments.module';
import { StorageModule } from './storage/storage.module';
import { InventoryModule } from './inventory/inventory.module';
import { RetailModule } from './retail/retail.module';
// Entities
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
import { Bill } from './billing/entities/bill.entity';
import { DayBook } from './billing/entities/day-book.entity';
import { Estimate } from './billing/entities/estimate.entity';
import { Payment, PaymentReversal } from './payments/entities/payment.entity';
import { InsuranceClaim } from './payments/entities/insurance-claim.entity';
import { PaymentPlan } from './payments/entities/payment-plan.entity';

@Module({
  imports: [
    // 1. Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Asynchronous TypeORM Configuration
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
          Bill,
          DayBook,
          Estimate,
          Payment,
          PaymentReversal,
          InsuranceClaim,
          PaymentPlan,
        ],
        
        synchronize: true, 
        logging: true,
      }),
    }),

    // 3. Registered Application Modules matching your folder structure
    AuthModule,
    PatientsModule,
    SchedulerModule,
    EmrModule,
    BillingModule,
    PaymentsModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}