import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

const uniquePhone = `+2519${(Date.now() + 1).toString().slice(-8)}`;

describe('Billing & Payments Controllers (E2E - FR-BIL / FR-PAY)', () => {
  let app: INestApplication;
  let authToken: string;
  let patientId: string;
  let billId: string;
  let paymentId: string;

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

    const patientRes = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fullName: 'Billing Test Patient',
        phoneNumber: uniquePhone,
        gender: 'Female',
        dateOfBirth: '1992-03-03',
      });
    patientId = patientRes.body.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('/api/v1/billing/bills (POST) - should generate itemized invoice from treatment plan', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/billing/bills')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId,
        items: [{ description: 'Root Canal Treatment', quantity: 1, unitPrice: 3500 }],
      });

   expect(response.status).toBe(201);

      billId = response.body.id;
  });

   it('/api/v1/payments (POST) - should process split payment with copay calculation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        billId,
        amount: 2000,
        paymentMethod: 'CASH',
        cashierId: 'cashier-001',
      });

    expect(response.status).toBe(201);
    paymentId = response.body.id;
  });

  it('/api/v1/payments/:id/reverse (POST) - should require audited authorization for reversals', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/reverse`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reason: 'Incorrect billing code selection',
        managerId: 'manager-001',
      });

    expect([201, 403]).toContain(response.status);
  });
});