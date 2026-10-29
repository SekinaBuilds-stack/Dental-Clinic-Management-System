// backend/src/emr/entities/treatment-plan-item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TreatmentPlan } from './treatment-plan.entity';

@Entity('treatment_plan_items')
export class TreatmentPlanItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  treatmentPlanId: string;

  @ManyToOne(() => TreatmentPlan, (plan) => plan.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treatmentPlanId' })
  treatmentPlan: TreatmentPlan;

  @Column({ type: 'int' })
  phaseNumber: number; // e.g., Phase 1, Phase 2

  @Column({ type: 'int', nullable: true })
  toothNumber: number;

  @Column({ length: 150 })
  procedureName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  estimatedCost: number;

  @Column({ default: 'Pending' })
  status: string; // "Pending", "Completed"
}