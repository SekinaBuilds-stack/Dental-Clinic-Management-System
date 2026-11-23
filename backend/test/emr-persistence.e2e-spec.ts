import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { EmrService } from './../src/emr/emr.service';

// FR-EMR-003 to FR-EMR-008: the EMR service reaches these tables by name
// (getRepository('clinical_notes') etc.). The unit tests mock the data source,
// so only a real database run can prove the tables exist and the service works.
describe('EMR persistence (FR-EMR-003..008)', () => {
  let app: INestApplication;
  let emr: EmrService;
  const patientId = `pat-emr-${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    emr = app.get(EmrService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('stores and lists clinical notes (FR-EMR-003)', async () => {
    const saved: any = await emr.createClinicalNote({
      patientId,
      toothNumber: 16,
      notes: 'Sensitivity to cold',
      diagnosis: 'Reversible pulpitis',
    });
    expect(saved.id).toBeDefined();

    const notes: any[] = await emr.getClinicalNotesByPatient(patientId);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ diagnosis: 'Reversible pulpitis', toothNumber: 16 });
  });

  it('stores a prescription with its items (FR-EMR-004)', async () => {
    const saved: any = await emr.createPrescription({
      patientId,
      prescriberId: 'dr-1',
      items: [{ drugName: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '5 days' }],
    });
    expect(saved.id).toBeDefined();
    expect(saved.items[0].drugName).toBe('Amoxicillin');
  });

  it('creates a lab order and moves it through its statuses (FR-EMR-005/006)', async () => {
    const order: any = await emr.createLabOrder({
      patientId,
      labName: 'DentLab',
      specifications: 'Zirconia crown, shade A2',
      cost: 120,
      toothNumber: 16,
    });
    expect(order.status).toBe('Sent');

    const progressed: any = await emr.updateLabOrderStatus(order.id, 'In Progress');
    expect(progressed.status).toBe('In Progress');
    const received: any = await emr.updateLabOrderStatus(order.id, 'Received');
    expect(received.status).toBe('Received');
  });

  it('stores imaging metadata (FR-EMR-007)', async () => {
    const saved: any = await emr.saveImagingRecord({
      patientId,
      fileUrl: 's3://dcms-clinical-files/xray-1.png',
      fileName: 'xray-1.png',
      toothNumber: 16,
      imagingType: 'X-ray',
    });
    expect(saved.id).toBeDefined();
  });

  it('stores a digital consent (FR-EMR-008)', async () => {
    const saved: any = await emr.saveConsent({
      patientId,
      procedureName: 'Extraction',
      signatureData: 'data:image/png;base64,AAAA',
      signedBy: 'Patient',
    });
    expect(saved.id).toBeDefined();
  });
});
