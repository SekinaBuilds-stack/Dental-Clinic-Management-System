import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('DCMS End-to-End UAT Simulation (TR-UAT-001)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdPatientId: string;
  let testDoctorId: string;
  let testChairId: string;
  let createdAppointmentId: string;

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

    // Fetch seeded doctor and chair for scheduling tests
    const doctorsRes = await request(app.getHttpServer())
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${authToken}`);
    
    if (doctorsRes.body && doctorsRes.body.length > 0) {
      testDoctorId = doctorsRes.body[0].id;
    }

    const chairsRes = await request(app.getHttpServer())
      .get('/api/v1/treatment-chairs')
      .set('Authorization', `Bearer ${authToken}`);
    
    if (chairsRes.body && chairsRes.body.length > 0) {
      testChairId = chairsRes.body[0].id;
    }
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
    createdPatientId = response.body.id;
    expect(response.body.fullName).toBe('Sekina Nesrie');
    expect(response.body.medicalAlerts).toContain('Penicillin Allergy');
    expect(response.body.medicalAlerts).toContain('Asthma');
  });

  it('Step 5: Patient Search & Profile Retrieval (TR-PAT-004, TR-PAT-005) - should search patient by phone and fetch profile/history', async () => {
    const searchRes = await request(app.getHttpServer())
      .get('/api/v1/patients/search?q=+251911223344')
      .set('Authorization', `Bearer ${authToken}`);

    expect(searchRes.status).toBe(200);
    expect(Array.isArray(searchRes.body)).toBe(true);
    expect(searchRes.body.length).toBeGreaterThan(0);
    expect(searchRes.body[0].medicalAlerts).toContain('Penicillin Allergy');

    const profileRes = await request(app.getHttpServer())
      .get(`/api/v1/patients/${createdPatientId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.fullName).toBe('Sekina Nesrie');
    expect(profileRes.body).toHaveProperty('visits');
  });

  it('Step 6: Appointment Booking & Conflict Detection (TR-APT-001, TR-APT-002, TR-APT-003) - should book appointment and prevent double-booking', async () => {
    const startTime = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
    const endTime = new Date(Date.now() + 86400000 + 3600000).toISOString(); // +1 hour

    // 1. Successful booking
    const bookingRes = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: testDoctorId,
        chairId: testChairId,
        startTime,
        endTime,
        notes: 'Routine checkup and cleaning',
      });

    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body).toHaveProperty('id');
    createdAppointmentId = bookingRes.body.id;
    expect(bookingRes.body.status).toBe('Booked');

    // 2. Conflict detection / Double-booking attempt
    const conflictRes = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: testDoctorId,
        chairId: testChairId,
        startTime,
        endTime,
        notes: 'Conflicting appointment',
      });

    expect(conflictRes.status).toBe(409);
  });

  it('Step 7: Appointment Status Lifecycle (TR-APT-004) - should transition appointment through operational states', async () => {
    const states = ['Confirmed', 'Checked-In', 'In Treatment', 'Completed'];

    for (const state of states) {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/appointments/${createdAppointmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: state });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(state);
    }
  });

  it('Step 8: Clinical Odontogram & Treatment Plan Creation (TR-EMR-001, TR-EMR-002) - should record tooth condition and treatment plan', async () => {
    // 1. Record Odontogram condition for tooth #16
    const odontogramRes = await request(app.getHttpServer())
      .post('/api/v1/odontograms')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        toothNumber: 16,
        condition: 'CARIES',
        surface: 'OCLUSAL',
        notes: 'Deep pit and fissure caries',
      });

    expect([200, 201]).toContain(odontogramRes.status);
    expect(odontogramRes.body).toHaveProperty('id');
    expect(odontogramRes.body.toothNumber).toBe(16);

    // 2. Create Phased Treatment Plan
    const planRes = await request(app.getHttpServer())
      .post('/api/v1/treatment-plans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: testDoctorId,
        title: 'Comprehensive Restoration & Hygiene Plan',
        phases: [
          {
            phaseNumber: 1,
            description: 'Pain relief and composite restoration on tooth #16',
            items: [
              { toothNumber: 16, procedureCode: 'PROC-COMP-01', procedureName: 'Composite Restoration - 1 Surface', cost: 1500.00 },
            ],
          },
        ],
        totalEstimatedCost: 1500.00,
        isAccepted: true,
      });

    expect([200, 201]).toContain(planRes.status);
    expect(planRes.body).toHaveProperty('id');
    expect(planRes.body.isAccepted).toBe(true);
  });

  it('Step 9: Clinical Notes, Prescriptions & Digital Consent (TR-EMR-003, TR-EMR-004, TR-EMR-008) - should record visit notes, allergy-safe prescription, and signed consent', async () => {
    // 1. Record Clinical Visit Notes (TR-EMR-003)
    const notesRes = await request(app.getHttpServer())
      .post('/api/v1/clinical-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: testDoctorId,
        appointmentId: createdAppointmentId,
        chiefComplaint: 'Sensitivity on upper right molar',
        clinicalFindings: 'Occlusal caries on tooth #16, no pulpal exposure',
        procedureNotes: 'Local anesthesia administered (Lidocaine 2%), caries excavated, composite resin placed and cured.',
      });

    expect([200, 201]).toContain(notesRes.status);
    expect(notesRes.body).toHaveProperty('id');

    // 2. Issue Allergy-Safe Prescription (TR-EMR-004)
    const rxRes = await request(app.getHttpServer())
      .post('/api/v1/prescriptions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: testDoctorId,
        notes: 'Penicillin allergy noted — prescribed Clindamycin alternative',
        items: [
          {
            drugName: 'Clindamycin 300mg',
            dosage: '1 capsule',
            frequency: 'Every 8 hours',
            duration: '5 days',
            instructions: 'Take with a full glass of water after meals',
          },
          {
            drugName: 'Ibuprofen 400mg',
            dosage: '1 tablet',
            frequency: 'Every 8 hours as needed for pain',
            duration: '3 days',
            instructions: 'Take with food',
          },
        ],
      });

    expect([200, 201]).toContain(rxRes.status);
    expect(rxRes.body).toHaveProperty('id');

    // 3. Capture Digital Consent Signature (TR-EMR-008)
    const consentRes = await request(app.getHttpServer())
      .post('/api/v1/consents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        procedureName: 'Composite Restoration - Tooth #16',
        consentText: 'I acknowledge the risks, benefits, and alternatives for restorative dental treatment and consent to proceed.',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        signedBy: 'Sekina Nesrie',
      });

    expect([200, 201]).toContain(consentRes.status);
    expect(consentRes.body).toHaveProperty('id');
  });

  it('Step 10: MinIO Imaging S3 Storage Attachment (TR-EMR-007) - should upload X-ray image linked to patient and tooth #16', async () => {
    const dummyImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );

    const uploadRes = await request(app.getHttpServer())
      .post('/api/v1/imaging/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .field('patientId', createdPatientId)
      .field('appointmentId', createdAppointmentId)
      .field('toothNumber', 16)
      .field('imageType', 'PA_XRAY')
      .field('notes', 'Pre-operative periapical X-ray showing occlusal caries on tooth #16')
      .attach('file', dummyImageBuffer, {
        filename: 'tooth-16-periapical.png',
        contentType: 'image/png',
      });

    expect([200, 201]).toContain(uploadRes.status);
    expect(uploadRes.body).toHaveProperty('id');
    expect(uploadRes.body).toHaveProperty('fileUrl');
    expect(uploadRes.body.toothNumber).toBe(16);
  });
});