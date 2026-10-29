// backend/src/emr/entities/treatment-plan.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { TreatmentPlanItem } from './treatment-plan-item.entity';

export enum TreatmentPlanStatus {
  PROPOSED = 'Proposed',
  ACCEPTED = 'Accepted',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Entity('treatment_plans')
export class TreatmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ length: 150 })
  title: string; // e.g., "Full Mouth Restoration"

  @Column({
    type: 'enum',
    enum: TreatmentPlanStatus,
    default: TreatmentPlanStatus.PROPOSED,
  })
  status: TreatmentPlanStatus;

  @OneToMany(() => TreatmentPlanItem, (item) => item.treatmentPlan, { cascade: true })
  items: TreatmentPlanItem[];

  @Column({ default: false })
  isAccepted: boolean; // Digital patient consent flag

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}