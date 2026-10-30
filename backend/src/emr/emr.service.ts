// backend/src/emr/emr.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Odontogram } from './entities/odontogram.entity';
import { TreatmentPlan, TreatmentPlanStatus } from './entities/treatment-plan.entity';
import { ProcedureCatalog } from './entities/procedure-catalog.entity';

@Injectable()
export class EmrService {
  constructor(
    @InjectRepository(Odontogram)
    private odontogramRepo: Repository<Odontogram>,
    @InjectRepository(TreatmentPlan)
    private treatmentPlanRepo: Repository<TreatmentPlan>,
    @InjectRepository(ProcedureCatalog)
    private procedureCatalogRepo: Repository<ProcedureCatalog>,
    private dataSource: DataSource,
  ) {}

  // TR-EMR-002: Get tooth chart conditions for patient
  async getOdontogramByPatient(patientId: string): Promise<Odontogram[]> {
    return this.odontogramRepo.find({ where: { patientId } });
  }

  // TR-EMR-002: Upsert multiple tooth conditions in bulk with transaction safety
  async upsertOdontogram(dto: { 
    patientId: string; 
    conditions: Array<{ toothNumber: number; condition: string; notes?: string }> 
  }): Promise<Odontogram[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedRecords: Odontogram[] = [];

      for (const item of dto.conditions) {
        let record = await queryRunner.manager.findOne(Odontogram, {
          where: { patientId: dto.patientId, toothNumber: item.toothNumber },
        });

        if (record) {
          record.condition = item.condition;
          record.notes = item.notes || record.notes;
        } else {
          record = queryRunner.manager.create(Odontogram, {
            patientId: dto.patientId,
            toothNumber: item.toothNumber,
            condition: item.condition,
            notes: item.notes,
          });
        }

        const saved = await queryRunner.manager.save(Odontogram, record);
        savedRecords.push(saved);
      }

      await queryRunner.commitTransaction();
      return savedRecords;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // TR-EMR-001: Get phased treatment plans for patient
  async getTreatmentPlansByPatient(patientId: string): Promise<TreatmentPlan[]> {
    return this.treatmentPlanRepo.find({
      where: { patientId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  // TR-EMR-001: Create phased treatment plan with itemized costs
  async createTreatmentPlan(dto: any): Promise<TreatmentPlan> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const plan = queryRunner.manager.create(TreatmentPlan, {
        patientId: dto.patientId,
        title: dto.title,
        items: dto.items,
      });
      const saved = await queryRunner.manager.save(TreatmentPlan, plan);
      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // TR-EMR-001: Capture digital patient acceptance / consent
  async acceptTreatmentPlan(id: string): Promise<TreatmentPlan> {
    const plan = await this.treatmentPlanRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Treatment plan not found.');

    plan.isAccepted = true;
    plan.status = TreatmentPlanStatus.ACCEPTED;
    return this.treatmentPlanRepo.save(plan);
  }

  // TR-EMR-003: Clinical Progress Notes
  async createClinicalNote(dto: { patientId: string; visitId?: string; toothNumber?: number; notes: string; diagnosis: string }) {
    const noteRepo = this.dataSource.getRepository('clinical_notes');
    const note = noteRepo.create(dto);
    return noteRepo.save(note);
  }

  async getClinicalNotesByPatient(patientId: string) {
    return this.dataSource.getRepository('clinical_notes').find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  // TR-EMR-004: Prescriptions
  async createPrescription(dto: { patientId: string; prescriberId: string; items: Array<{ drugName: string; dosage: string; frequency: string; duration: string }> }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const prescription = queryRunner.manager.create('prescriptions', {
        patientId: dto.patientId,
        prescriberId: dto.prescriberId,
        items: dto.items,
      });
      const saved = await queryRunner.manager.save('prescriptions', prescription);
      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // TR-EMR-005 & TR-EMR-006: Lab Work Orders & Status
  async createLabOrder(dto: { patientId: string; labName: string; specifications: string; cost: number; toothNumber?: number }) {
    const labRepo = this.dataSource.getRepository('lab_orders');
    const labOrder = labRepo.create({ ...dto, status: 'Sent' });
    return labRepo.save(labOrder);
  }

  async updateLabOrderStatus(id: string, status: string) {
    const labRepo = this.dataSource.getRepository('lab_orders');
    const order = await labRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Lab order not found.');
    order.status = status;
    return labRepo.save(order);
  }

  // TR-EMR-007: Imaging Records (MinIO S3 Metadata)
  async saveImagingRecord(dto: { patientId: string; fileUrl: string; fileName: string; toothNumber?: number; imagingType?: string }) {
    const imagingRepo = this.dataSource.getRepository('imaging_files');
    const imaging = imagingRepo.create(dto);
    return imagingRepo.save(imaging);
  }

  // TR-EMR-008: Digital Consent
  async saveConsent(dto: { patientId: string; procedureName: string; signatureData: string; signedBy: string }) {
    const consentRepo = this.dataSource.getRepository('consents');
    const consent = consentRepo.create(dto);
    return consentRepo.save(consent);
  }

  // Procedure Catalog
  async getProcedureCatalog(): Promise<ProcedureCatalog[]> {
    return this.procedureCatalogRepo.find({ relations: { prices: true } });
  }
}