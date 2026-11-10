import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('payment_plans')
export class PaymentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  patientId: string;

  @Column({ type: 'varchar' })
  billId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'int' })
  installmentsCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  installmentAmount: number;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: string; // ACTIVE, COMPLETED, DEFAULTED

  @CreateDateColumn()
  createdAt: Date;
}