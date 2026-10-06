import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        
        // Keep synchronize false; use explicit migrations
        synchronize: false, 
        
        // Enable logging to see generated SQL queries during development
        logging: true,
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}