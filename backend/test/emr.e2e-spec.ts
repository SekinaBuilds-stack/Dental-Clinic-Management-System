import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

const uniquePhone = `+2519${Date.now().toString().slice(-8)}`;

describe('EmrController (E2E - FR-EMR)', () => {
  let app: INestApplication;
  let authToken: string;
  let patientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@dcms.com', password: 'Password123!' });
    authToken = loginRes.body.accessToken;

    // Create a real patient so patientId is a valid UUID
    const patientRes = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fullName: 'EMR Test Patient',
        phoneNumber: uniquePhone,
        gender: 'Male',
        dateOfBirth: '1990-01-01',
      });
    patientId = patientRes.body.id;
  });

  afterAll(async () => {
    await app?.close();
  });

   it('/api/v1/emr/treatment-plans (POST) - should create phased treatment plan', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/emr/treatment-plans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId,
        title: 'Phased Root Canal Plan',
        items: [
          {
            phaseNumber: 1,
            toothNumber: 16,
            procedureName: 'Root Canal Treatment (RCT-01)',
            estimatedCost: 3500,
          },
        ],
      });

    expect([201, 400, 404]).toContain(response.status);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.items).toHaveLength(1);
  });
});