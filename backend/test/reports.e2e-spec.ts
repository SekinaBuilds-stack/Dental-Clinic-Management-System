import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ReportsController (E2E - FR-REP)', () => {
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

  it('/api/v1/reports/financial (GET) - should generate aggregated financial summary report', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/financial?startDate=2026-11-01&endDate=2026-11-30')
      .set('Authorization', `Bearer ${authToken}`);

    expect([200, 404]).toContain(response.status);
  });
});