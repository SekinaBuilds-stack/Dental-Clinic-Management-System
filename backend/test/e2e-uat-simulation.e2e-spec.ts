import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('DCMS End-to-End UAT Simulation (TR-UAT-001)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
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

  it('Step 3: Patient Pre-Registration (TR-PAT-001) - should create a pre-registered walk-in patient', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fullName: 'PreRegistered WalkIn Patient',
        phoneNumber: '+251922334455',
        gender: 'Male',
        dateOfBirth: '1995-03-12',
        isPreRegistered: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.isPreRegistered).toBe(true);
  });

  it('Step 4: Full Patient Registration & Medical Alerts (TR-PAT-002, TR-PAT-003) - should register patient with full demographics and medical alerts', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fullName: 'Sekina Nesrie',
        phoneNumber: '+251911223344',
        email: 'sekina.nesrie@example.com',
        gender: 'Female',
        dateOfBirth: '2001-05-07',
        emergencyContactName: 'Misgana Messay',
        emergencyContactPhone: '+251933445566',
        referralSource: 'Walk-in',
        medicalAlerts: ['Penicillin Allergy', 'Asthma'],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.fullName).toBe('Sekina Nesrie');
    expect(response.body.medicalAlerts).toContain('Penicillin Allergy');
    expect(response.body.medicalAlerts).toContain('Asthma');
  });
});