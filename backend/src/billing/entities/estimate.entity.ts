import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('estimates')
export class Estimate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  patientId: string;

  @Column({ type: 'varchar', nullable: true })
  treatmentPlanId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalEstimate: number;

  @Column({ type: 'varchar', default: 'CURRENT' })
  status: string; // CURRENT, REVISED, SUPERSEDED, CONVERTED

  @Column({ type: 'jsonb' })
  items: Array<{ description: string; quantity: number; unitPrice: number; totalPrice: number }>;

  @CreateDateColumn()
  createdAt: Date;
}