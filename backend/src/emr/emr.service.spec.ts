import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { EmrService } from './emr.service';
import { Odontogram } from './entities/odontogram.entity';
import { TreatmentPlan, TreatmentPlanStatus } from './entities/treatment-plan.entity';
import { makeQueryRunner } from '../test-utils/mock-query-runner';

describe('EmrService (FR-EMR)', () => {
  let service: EmrService;
  let qr: ReturnType<typeof makeQueryRunner>;
  let odontogramRepo: any;
  let planRepo: any;
  let catalogRepo: any;
  let genericRepo: any;
  let dataSource: any;

  beforeEach(() => {
    qr = makeQueryRunner();
    odontogramRepo = { find: vi.fn() };
    planRepo = { find: vi.fn(), findOne: vi.fn(), save: vi.fn(async (x: any) => x) };
    catalogRepo = { find: vi.fn() };
    genericRepo = {
      create: vi.fn((x: any) => ({ ...x })),
      save: vi.fn(async (x: any) => ({ id: 'new-1', ...x })),
      find: vi.fn(),
      findOne: vi.fn(),
    };
    dataSource = { ...qr.dataSource, getRepository: vi.fn(() => genericRepo) };
    service = new EmrService(odontogramRepo, planRepo, catalogRepo, dataSource);
  });

  describe('odontogram (TR-EMR-002)', () => {
    it('fetches the chart for a patient', async () => {
      odontogramRepo.find.mockResolvedValue([{ toothNumber: 16 }]);
      await expect(service.getOdontogramByPatient('p1')).resolves.toEqual([{ toothNumber: 16 }]);
      expect(odontogramRepo.find).toHaveBeenCalledWith({ where: { patientId: 'p1' } });
    });

    it('creates new tooth records and commits in one transaction', async () => {
      qr.manager.findOne.mockResolvedValue(null);

      const result = await service.upsertOdontogram({
        patientId: 'p1',
        conditions: [
          { toothNumber: 11, condition: 'decayed' },
          { toothNumber: 12, condition: 'filled', notes: 'amalgam' },
        ],
      });

      expect(qr.manager.create).toHaveBeenCalledWith(
        Odontogram,
        expect.objectContaining({ patientId: 'p1', toothNumber: 12, condition: 'filled', notes: 'amalgam' }),
      );
      expect(result).toHaveLength(2);
      expect(qr.queryRunner.commitTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });

    it('updates an existing tooth record and keeps old notes when none are supplied', async () => {
      qr.manager.findOne.mockResolvedValue({ patientId: 'p1', toothNumber: 16, condition: 'healthy', notes: 'old note' });

      const [saved] = await service.upsertOdontogram({
        patientId: 'p1',
        conditions: [{ toothNumber: 16, condition: 'crown' }],
      });

      expect(qr.manager.create).not.toHaveBeenCalled();
      expect(saved.condition).toBe('crown');
      expect(saved.notes).toBe('old note');
    });

    it('rolls back, releases and rethrows when a save fails', async () => {
      qr.manager.findOne.mockResolvedValue(null);
      qr.manager.save.mockRejectedValueOnce(new Error('db down'));

      await expect(
        service.upsertOdontogram({ patientId: 'p1', conditions: [{ toothNumber: 11, condition: 'decayed' }] }),
      ).rejects.toThrow('db down');

      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('treatment plans (TR-EMR-001)', () => {
    it('lists plans newest first with their items', async () => {
      planRepo.find.mockResolvedValue([]);
      await service.getTreatmentPlansByPatient('p1');
      expect(planRepo.find).toHaveBeenCalledWith({
        where: { patientId: 'p1' },
        relations: { items: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('creates a plan transactionally', async () => {
      const items = [{ description: 'RCT', cost: 3500 }];
      await service.createTreatmentPlan({ patientId: 'p1', title: 'Phase 1', items });

      expect(qr.manager.create).toHaveBeenCalledWith(TreatmentPlan, { patientId: 'p1', title: 'Phase 1', items });
      expect(qr.queryRunner.commitTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });

    it('rolls back when plan creation fails', async () => {
      qr.manager.save.mockRejectedValueOnce(new Error('null value in column "title"'));
      await expect(service.createTreatmentPlan({ patientId: 'p1', items: [] })).rejects.toThrow();
      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });

    it('accepts a plan and records digital acceptance', async () => {
      planRepo.findOne.mockResolvedValue({ id: 'tp1', isAccepted: false, status: 'PROPOSED' });
      const result = await service.acceptTreatmentPlan('tp1');
      expect(result.isAccepted).toBe(true);
      expect(result.status).toBe(TreatmentPlanStatus.ACCEPTED);
    });

    it('throws NotFoundException when accepting an unknown plan', async () => {
      planRepo.findOne.mockResolvedValue(null);
      await expect(service.acceptTreatmentPlan('nope')).rejects.toThrow(NotFoundException);
      expect(planRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('clinical notes, lab orders, imaging, consent', () => {
    it('creates a clinical note (TR-EMR-003)', async () => {
      const dto = { patientId: 'p1', notes: 'Sensitivity on 16', diagnosis: 'Caries' };
      const result = await service.createClinicalNote(dto);
      expect(dataSource.getRepository).toHaveBeenCalledWith('clinical_notes');
      expect(genericRepo.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('new-1');
    });

    it('lists clinical notes newest first', async () => {
      genericRepo.find.mockResolvedValue([]);
      await service.getClinicalNotesByPatient('p1');
      expect(genericRepo.find).toHaveBeenCalledWith({ where: { patientId: 'p1' }, order: { createdAt: 'DESC' } });
    });

    it('creates a prescription transactionally (TR-EMR-004)', async () => {
      await service.createPrescription({
        patientId: 'p1',
        prescriberId: 'dr1',
        items: [{ drugName: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '5d' }],
      });
      expect(qr.manager.create).toHaveBeenCalledWith(
        'prescriptions',
        expect.objectContaining({ patientId: 'p1', prescriberId: 'dr1' }),
      );
      expect(qr.queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('rolls back a failed prescription', async () => {
      qr.manager.save.mockRejectedValueOnce(new Error('fail'));
      await expect(
        service.createPrescription({ patientId: 'p1', prescriberId: 'dr1', items: [] }),
      ).rejects.toThrow('fail');
      expect(qr.queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(qr.queryRunner.release).toHaveBeenCalled();
    });

    it('creates a lab order with initial status Sent (TR-EMR-005)', async () => {
      await service.createLabOrder({ patientId: 'p1', labName: 'DentLab', specifications: 'zirconia crown', cost: 120 });
      expect(genericRepo.create).toHaveBeenCalledWith(expect.objectContaining({ labName: 'DentLab', status: 'Sent' }));
    });

    it('updates a lab order status (TR-EMR-006)', async () => {
      genericRepo.findOne.mockResolvedValue({ id: 'lab1', status: 'Sent' });
      const result = await service.updateLabOrderStatus('lab1', 'Received');
      expect(result.status).toBe('Received');
    });

    it('throws NotFoundException for an unknown lab order', async () => {
      genericRepo.findOne.mockResolvedValue(null);
      await expect(service.updateLabOrderStatus('nope', 'Received')).rejects.toThrow(NotFoundException);
    });

    it('stores imaging metadata (TR-EMR-007) and consent (TR-EMR-008)', async () => {
      await service.saveImagingRecord({ patientId: 'p1', fileUrl: 's3://x/y.png', fileName: 'y.png' });
      expect(dataSource.getRepository).toHaveBeenCalledWith('imaging_files');

      await service.saveConsent({ patientId: 'p1', procedureName: 'Extraction', signatureData: 'data:img', signedBy: 'Patient' });
      expect(dataSource.getRepository).toHaveBeenCalledWith('consents');
    });
  });

  it('returns the procedure catalog with prices', async () => {
    catalogRepo.find.mockResolvedValue([{ id: 'pc1' }]);
    await expect(service.getProcedureCatalog()).resolves.toEqual([{ id: 'pc1' }]);
    expect(catalogRepo.find).toHaveBeenCalledWith({ relations: { prices: true } });
  });
});
