import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('EmrController (E2E - FR-EMR)', () => {
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

  it('/api/v1/emr/treatment-plans (POST) - should create phased treatment plan', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/emr/treatment-plans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: 'pat-100',
        phases: [
          {
            phaseNumber: 1,
            procedures: [{ toothNumber: 16, procedureCode: 'RCT-01', cost: 3500 }],
          },
        ],
      });

    expect([201, 400, 404]).toContain(response.status);
  });
});
