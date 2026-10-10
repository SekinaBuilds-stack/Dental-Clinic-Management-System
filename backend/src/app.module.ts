import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { Patient } from './patients/entities/patient.entity';
import { PatientMedicalAlert } from './patients/entities/patient-medical-alert.entity';

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
        
        // Automatically load entities
        entities: [__dirname + '/**/*.entity{.ts,.js}', Patient, PatientMedicalAlert],
        
        // Keep synchronize false; use explicit migrations
        synchronize: true, 
        
        // Enable logging to see generated SQL queries during development
        logging: true,
      }),
    }),

    // 3. Authentication Module
    AuthModule,
    PatientsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}