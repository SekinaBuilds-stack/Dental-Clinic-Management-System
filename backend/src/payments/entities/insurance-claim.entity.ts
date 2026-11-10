import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('insurance_claims')
export class InsuranceClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  patientId: string;

  @Column({ type: 'varchar' })
  insuranceProvider: string;

  @Column({ type: 'varchar' })
  policyNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  claimAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  copayAmount: number;

  @Column({ type: 'varchar', default: 'SUBMITTED' })
  status: string; // SUBMITTED, APPROVED, REJECTED, PAID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}