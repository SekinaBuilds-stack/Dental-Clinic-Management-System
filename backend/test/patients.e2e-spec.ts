import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('PatientsController (E2E - FR-PAT)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Authenticate test admin/receptionist session
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@dcms.com', password: 'Password123!' });
    
    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/patients (POST) - should register a new patient successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fullName: 'Sekina Nesrie',
        phone: '+251911223344',
        gender: 'Female',
        dateOfBirth: '2001-05-07',
        medicalAlerts: ['Penicillin Allergy'],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.fullName).toBe('Sekina Nesrie');
  });

  it('/api/v1/patients/search?q= (GET) - should search patient by phone number', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/patients/search?q=+251911223344')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].medicalAlerts).toContain('Penicillin Allergy');
  });
});