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

  // TR-EMR-001: Get phased treatment plans for patient (TypeORM 0.3+ relations object)
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

  // Procedure Catalog (TypeORM 0.3+ relations object)
  async getProcedureCatalog(): Promise<ProcedureCatalog[]> {
    return this.procedureCatalogRepo.find({ relations: { prices: true } });
  }
}