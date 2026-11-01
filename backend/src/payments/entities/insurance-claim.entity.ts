// backend/src/payments/entities/insurance-claim.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('insurance_claims')
export class InsuranceClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column()
  insuranceProvider: string;

  @Column()
  policyNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  claimAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  copayAmount: number;

  @Column({ default: 'SUBMITTED' })
  status: string; // SUBMITTED, APPROVED, REJECTED, PAID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}