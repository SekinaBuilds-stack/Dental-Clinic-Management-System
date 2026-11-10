import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('insurance_policies')
export class InsurancePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  providerName: string;

  @Column({ type: 'varchar', unique: true })
  policyNumber: string;

  @Column({ type: 'varchar' })
  patientId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 80.0 })
  coveragePercentage: number; // e.g. 80% coverage

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}