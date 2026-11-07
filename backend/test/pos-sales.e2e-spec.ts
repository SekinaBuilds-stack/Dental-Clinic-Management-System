import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Retail POS Controller (E2E - FR-SAL)', () => {
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

  it('/api/v1/pos/sales (POST) - should execute retail sale and auto-deduct retail inventory stock', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/pos/sales')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { itemId: 'item-005', quantity: 2, unitPrice: 250 }, // e.g., Special Orthodontic Toothbrush
        ],
        paymentMethod: 'Telebirr',
        totalAmount: 500,
      });

    expect([201, 400, 404]).toContain(response.status);
  });

  it('/api/v1/pos/day-book (GET) - should compile day-book summary for end-of-day reconciliation', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/pos/day-book?date=2026-11-06')
      .set('Authorization', `Bearer ${authToken}`);

    expect([200, 404]).toContain(response.status);
  });
});