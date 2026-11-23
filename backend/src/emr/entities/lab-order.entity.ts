import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

// FR-EMR-005 / FR-EMR-006: lab work orders. Statuses: Sent, In Progress, Received.
@Entity('lab_orders')
export class LabOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  patientId: string;

  @Column({ type: 'varchar' })
  labName: string;

  @Column({ type: 'text' })
  specifications: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'int', nullable: true })
  toothNumber: number | null;

  @Column({ type: 'varchar', default: 'Sent' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
