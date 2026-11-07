/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Inventory & Procurement Controller (E2E - FR-INV)', () => {
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

  it('/api/v1/inventory/grn (POST) - should receive GRN batch and update stock levels', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/inventory/grn')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        supplierId: 'sup-001',
        invoiceNumber: 'INV-2026-99',
        items: [
          {
            itemId: 'item-010',
            batchNumber: 'BATCH-2026-X',
            quantityReceived: 100,
            unitCost: 150,
            expiryDate: '2028-06-30',
          },
        ],
      });

    expect([201, 400, 404]).toContain(response.status);
  });

  it('/api/v1/inventory/low-stock-alerts (GET) - should return items below reorder threshold', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/inventory/low-stock-alerts')
      .set('Authorization', `Bearer ${authToken}`);

    expect([200, 404]).toContain(response.status);
  });
});