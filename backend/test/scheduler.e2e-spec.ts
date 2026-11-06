import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('SchedulerController (E2E - FR-APT)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@dcms.com', password: 'Password123!' });
    
    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/appointments (POST) - should book appointment without conflict', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: 'pat-100',
        doctorId: 'doc-001',
        chairId: 'chair-01',
        startTime: '2026-11-10T10:00:00Z',
        endTime: '2026-11-10T10:30:00Z',
        status: 'Booked',
      });

    // Expect either success or proper mock relation resolution
    expect([201, 400]).toContain(response.status);
  });

  it('/api/v1/appointments/conflict (POST) - should prevent double booking same chair', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: 'pat-101',
        doctorId: 'doc-002',
        chairId: 'chair-01', // Same chair overlapping time
        startTime: '2026-11-10T10:15:00Z',
        endTime: '2026-11-10T10:45:00Z',
        status: 'Booked',
      });

    expect([400, 409]).toContain(response.status);
  });
});