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
  let createdBillId: string;
  let splitPaymentBillId: string;
  let lastPaymentId: string;
  let insuranceBillId: string;
  let createdRequisitionId: string;
  let createdRfqId: string;
  let createdPoId: string;

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

  it('Step 11: Chairside Material Consumption & Inventory Deduction (TR-INV-009, TR-INV-010) - should record material consumption and verify stock ledger movement', async () => {
    const consumptionRes = await request(app.getHttpServer())
      .post('/api/v1/material-consumptions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: testDoctorId,
        appointmentId: createdAppointmentId,
        toothNumber: 16,
        procedureCode: 'PROC-COMP-01',
        items: [
          {
            itemSku: 'CONS-COMP-RESIN',
            quantityConsumed: 1,
            unit: 'syringe',
          },
        ],
      });

    expect([200, 201]).toContain(consumptionRes.status);
    expect(consumptionRes.body).toHaveProperty('id');
    expect(consumptionRes.body).toHaveProperty('stockMovements');
  });

  it('Step 12: Procedure Price List & Itemized Bill Generation (TR-BIL-001, TR-BIL-002, TR-BIL-003) - should configure prices, generate estimate, and create itemized bill', async () => {
    // 1. Configure / Verify Procedure Price (TR-BIL-001)
    const priceRes = await request(app.getHttpServer())
      .post('/api/v1/procedure-prices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        procedureCode: 'PROC-COMP-01',
        procedureName: 'Composite Restoration - 1 Surface',
        basePrice: 1500.00,
        toothSpecificPricing: true,
      });

    expect([200, 201]).toContain(priceRes.status);

    // 2. Generate Treatment Estimate from Treatment Plan (TR-BIL-003)
    const estimateRes = await request(app.getHttpServer())
      .post('/api/v1/estimates')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        items: [
          { procedureCode: 'PROC-COMP-01', description: 'Composite Restoration on Tooth #16', unitPrice: 1500.00, quantity: 1, total: 1500.00 }
        ],
        totalAmount: 1500.00,
      });

    expect([200, 201]).toContain(estimateRes.status);
    expect(estimateRes.body).toHaveProperty('id');
    expect(estimateRes.body.totalAmount).toBe(1500.00);

    // 3. Generate Itemized Bill (TR-BIL-002)
    const billRes = await request(app.getHttpServer())
      .post('/api/v1/bills')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        appointmentId: createdAppointmentId,
        items: [
          { procedureCode: 'PROC-COMP-01', description: 'Composite Restoration on Tooth #16', unitPrice: 1500.00, quantity: 1, total: 1500.00 }
        ],
        totalAmount: 1500.00,
      });

    expect([200, 201]).toContain(billRes.status);
    expect(billRes.body).toHaveProperty('id');
    createdBillId = billRes.body.id;
    expect(billRes.body.status).toBe('UNPAID');
  });

  it('Step 13: Day-Book Transaction Summary & Receipt Issuance (TR-BIL-005, TR-BIL-006) - should record payment, issue receipt, and verify day-book summary', async () => {
    // 1. Record Payment & Issue Receipt (TR-BIL-006)
    const paymentRes = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        billId: createdBillId,
        amountPaid: 1500.00,
        paymentMethod: 'CASH',
        referenceNumber: 'CASH-REC-001',
      });

    expect([200, 201]).toContain(paymentRes.status);
    expect(paymentRes.body).toHaveProperty('receiptNumber');

    // 2. Verify Day-Book Daily Transaction Summary (TR-BIL-005)
    const todayStr = new Date().toISOString().split('T')[0];
    const dayBookRes = await request(app.getHttpServer())
      .get(`/api/v1/day-book?date=${todayStr}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(dayBookRes.status).toBe(200);
    expect(dayBookRes.body).toHaveProperty('totalCollections');
    expect(Number(dayBookRes.body.totalCollections)).toBeGreaterThanOrEqual(1500.00);
  });

  it('Step 14: Cashier Payment Terminal & Multi-Method Checkout (TR-PAY-001, TR-PAY-002) - should process split Card and Mobile Money payments and verify ledger', async () => {
    // 1. Create a follow-up hygiene bill for split payment validation
    const hygieneBillRes = await request(app.getHttpServer())
      .post('/api/v1/bills')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        items: [
          { procedureCode: 'PROC-SCAL-01', description: 'Ultrasonic Scaling & Polishing', unitPrice: 1000.00, quantity: 1, total: 1000.00 },
        ],
        totalAmount: 1000.00,
      });

    expect([200, 201]).toContain(hygieneBillRes.status);
    splitPaymentBillId = hygieneBillRes.body.id;

    // 2. Pay partial amount via CARD (TR-PAY-002)
    const cardPaymentRes = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        billId: splitPaymentBillId,
        amountPaid: 600.00,
        paymentMethod: 'CARD',
        referenceNumber: 'POS-CARD-9876',
      });

    expect([200, 201]).toContain(cardPaymentRes.status);

    // 3. Pay remaining balance via MOBILE_MONEY (TR-PAY-002)
    const mobileMoneyRes = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        billId: splitPaymentBillId,
        amountPaid: 400.00,
        paymentMethod: 'MOBILE_MONEY',
        referenceNumber: 'TELEBIRR-TXN-54321',
      });

    expect([200, 201]).toContain(mobileMoneyRes.status);
    lastPaymentId = mobileMoneyRes.body.id;

    // 4. Verify Payment Ledger reflects paid transactions (TR-PAY-001)
    const ledgerRes = await request(app.getHttpServer())
      .get('/api/v1/payments')
      .set('Authorization', `Bearer ${authToken}`);

    expect(ledgerRes.status).toBe(200);
    expect(Array.isArray(ledgerRes.body)).toBe(true);
    expect(ledgerRes.body.length).toBeGreaterThanOrEqual(3);
  });

  it('Step 15: Insurance Claim Submission & Co-Pay Calculation (TR-PAY-004, TR-PAY-005, TR-PAY-006) - should submit insurance claim, calculate co-pay, and track status', async () => {
    // 1. Create a bill for insurance procedure
    const insBillRes = await request(app.getHttpServer())
      .post('/api/v1/bills')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        items: [
          { procedureCode: 'PROC-CROWN-01', description: 'Porcelain Crown - Tooth #16', unitPrice: 5000.00, quantity: 1, total: 5000.00 },
        ],
        totalAmount: 5000.00,
      });

    expect([200, 201]).toContain(insBillRes.status);
    insuranceBillId = insBillRes.body.id;

    // 2. Submit Insurance Claim & Calculate Co-Pay (TR-PAY-004, TR-PAY-006)
    const claimRes = await request(app.getHttpServer())
      .post('/api/v1/insurance-claims')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: createdPatientId,
        billId: insuranceBillId,
        insuranceProvider: 'Awash Insurance',
        policyNumber: 'POL-AWASH-998877',
        claimedAmount: 4000.00, // 80% coverage
        calculatedCopay: 1000.00, // 20% patient co-pay
      });

    expect([200, 201]).toContain(claimRes.status);
    expect(claimRes.body).toHaveProperty('id');
    expect(claimRes.body.status).toBe('Submitted');
    expect(claimRes.body.calculatedCopay).toBe(1000.00);

    // 3. Track Claim Status (TR-PAY-005)
    const claimId = claimRes.body.id;
    const statusRes = await request(app.getHttpServer())
      .get(`/api/v1/insurance-claims/${claimId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe('Submitted');
  });

  it('Step 16: Audited Payment Reversals (TR-PAY-003, TR-CORE-005) - should reverse payment and record audit log entry', async () => {
    // 1. Process payment reversal/refund for last payment (TR-PAY-003)
    const reversalRes = await request(app.getHttpServer())
      .post(`/api/v1/payments/${lastPaymentId}/reverse`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reason: 'Duplicate checkout entry error',
      });

    expect([200, 201]).toContain(reversalRes.status);
    expect(reversalRes.body).toHaveProperty('status');
    expect(reversalRes.body.status).toBe('REVERSED');

    // 2. Verify immutable audit log entry was generated (TR-CORE-005)
    const auditRes = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?action=PAYMENT_REVERSAL')
      .set('Authorization', `Bearer ${authToken}`);

    expect(auditRes.status).toBe(200);
    expect(Array.isArray(auditRes.body)).toBe(true);
    expect(auditRes.body.length).toBeGreaterThan(0);
  });

  it('Step 17: Supplier Procurement Requisition & Purchase Orders (TR-INV-001, TR-INV-002, TR-INV-003) - should create PR, RFQ, and PO', async () => {
    // 1. Create Material Requisition (PR) (TR-INV-001)
    const prRes = await request(app.getHttpServer())
      .post('/api/v1/purchase-requisitions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        department: 'Dental Clinic',
        items: [
          { itemSku: 'CONS-COMP-RESIN', quantityRequested: 10, unit: 'syringe' },
        ],
        notes: 'Restocking low inventory for composite restoration procedures',
      });

    expect([200, 201]).toContain(prRes.status);
    expect(prRes.body).toHaveProperty('id');
    createdRequisitionId = prRes.body.id;
    expect(prRes.body.status).toBe('PENDING');

    // 2. Issue Request for Quotation (RFQ) (TR-INV-002)
    const rfqRes = await request(app.getHttpServer())
      .post('/api/v1/rfps')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        requisitionId: createdRequisitionId,
        supplierName: 'Addis Dental Supplies Plc',
        deadline: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
      });

    expect([200, 201]).toContain(rfqRes.status);
    expect(rfqRes.body).toHaveProperty('id');
    createdRfqId = rfqRes.body.id;

    // 3. Generate Purchase Order (PO) (TR-INV-003)
    const poRes = await request(app.getHttpServer())
      .post('/api/v1/purchase-orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        requisitionId: createdRequisitionId,
        rfqId: createdRfqId,
        supplierName: 'Addis Dental Supplies Plc',
        items: [
          { itemSku: 'CONS-COMP-RESIN', quantity: 10, unitPrice: 1200.00, total: 12000.00 }
        ],
        totalAmount: 12000.00,
      });

    expect([200, 201]).toContain(poRes.status);
    expect(poRes.body).toHaveProperty('id');
    createdPoId = poRes.body.id;
    expect(poRes.body.status).toBe('ISSUED');
  });

  it('Step 18: Goods Receipt Note & Automated Inventory Stock-In (TR-INV-004, TR-INV-005) - should receive PO delivery and automatically increment inventory stock', async () => {
    // 1. Check initial inventory stock level before GRN (TR-INV-005)
    const preStockRes = await request(app.getHttpServer())
      .get('/api/v1/inventory/items?sku=CONS-COMP-RESIN')
      .set('Authorization', `Bearer ${authToken}`);

    const initialStock = preStockRes.body?.[0]?.currentStock ?? 0;

    // 2. Record Goods Receipt Note (GRN) against PO (TR-INV-004)
    const grnRes = await request(app.getHttpServer())
      .post('/api/v1/goods-receipt-notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        purchaseOrderId: createdPoId,
        deliveryNoteNumber: 'DN-ADS-2026-089',
        receivedItems: [
          {
            itemSku: 'CONS-COMP-RESIN',
            quantityReceived: 10,
            batchNumber: 'BATCH-CR-2026A',
            expiryDate: '2028-11-30',
          },
        ],
        notes: 'All 10 composite syringes inspected and accepted in good condition',
      });

    expect([200, 201]).toContain(grnRes.status);
    expect(grnRes.body).toHaveProperty('id');
    expect(grnRes.body.status).toBe('COMPLETED');

    // 3. Verify Inventory Stock-In incremented on-hand balance (TR-INV-005)
    const postStockRes = await request(app.getHttpServer())
      .get('/api/v1/inventory/items?sku=CONS-COMP-RESIN')
      .set('Authorization', `Bearer ${authToken}`);

    expect(postStockRes.status).toBe(200);
    const updatedStock = postStockRes.body?.[0]?.currentStock ?? 0;
    expect(updatedStock).toBe(initialStock + 10);
  });
});