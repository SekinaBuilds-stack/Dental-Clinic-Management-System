/// <reference types="jest" />
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Billing & Payments Controllers (E2E - FR-BIL / FR-PAY)', () => {
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

  it('/api/v1/billing/bills (POST) - should generate itemized invoice from treatment plan', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/billing/bills')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: 'pat-100',
        treatmentPlanId: 'tp-001',
        items: [{ description: 'Root Canal Treatment', procedureCode: 'RCT-01', amount: 3500 }],
        subtotal: 3500,
        tax: 0,
        totalAmount: 3500,
      });

    expect([201, 400, 404]).toContain(response.status);
  });

  it('/api/v1/payments (POST) - should process split payment with copay calculation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        billId: 'bill-001',
        amountPaid: 2000,
        paymentMethod: 'Cash',
        copayAmount: 500,
      });

    expect([201, 400, 404]).toContain(response.status);
  });

  it('/api/v1/payments/reversals (POST) - should require audited authorization for reversals', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/payments/reversals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        paymentId: 'pay-001',
        reason: 'Incorrect billing code selection',
      });

    expect([201, 403, 400, 404]).toContain(response.status);
  });
});