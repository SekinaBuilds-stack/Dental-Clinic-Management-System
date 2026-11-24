import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

// Regression guard for the "white screen" bug: a controller that repeats the global
// prefix, or a module that is not imported, makes a route 404. A guarded route that
// exists answers 401 without a token; a route that does not exist answers 404.
describe('Route smoke test (every screen API is mounted under /api/v1)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api/v1'); // same as main.ts
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  const gets = [
    '/api/v1/inventory/items',
    '/api/v1/inventory/suppliers',
    '/api/v1/inventory/ledger',
    '/api/v1/inventory/batches',
    '/api/v1/procurement/requisitions',
    '/api/v1/procurement/adjustments',
    '/api/v1/reports/collections',
    '/api/v1/reports/doctor-production',
    '/api/v1/reports/treatment-analysis',
    '/api/v1/reports/receivables-aging',
    '/api/v1/audit-logs',
    '/api/v1/payments/ledger',
    '/api/v1/payments/insurance-claims',
    '/api/v1/payments/payment-plans',
  ];

  it.each(gets)('GET %s exists and is protected', async (path) => {
    const res = await request(app.getHttpServer()).get(path);
    expect(res.status).toBe(401);
  });

  it('does not expose the old doubled prefix', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/api/v1/inventory/items');
    expect(res.status).toBe(404);
  });
});
