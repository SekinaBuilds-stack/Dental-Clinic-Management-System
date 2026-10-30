// backend/src/billing/entities/estimate.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('estimates')
export class Estimate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column({ nullable: true })
  treatmentPlanId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalEstimate: number;

  @Column({ default: 'CURRENT' })
  status: string; // CURRENT, REVISED, SUPERSEDED, CONVERTED

  @Column({ type: 'jsonb' })
  items: Array<{ description: string; quantity: number; unitPrice: number; totalPrice: number }>;

  @CreateDateColumn()
  createdAt: Date;
}