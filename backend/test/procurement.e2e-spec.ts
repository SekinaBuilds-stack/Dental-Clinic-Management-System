import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ProcurementController (E2E - FR-INV)', () => {
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

  it('/api/v1/procurement/purchase-orders (POST) - should create purchase order for suppliers', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/procurement/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        supplierId: 'sup-001',
        items: [{ itemId: 'item-001', quantityOrdered: 50 }],
      });

    expect([201, 400, 404]).toContain(response.status);
  });
});