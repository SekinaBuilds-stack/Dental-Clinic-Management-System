// backend/src/payments/entities/payment-plan.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('payment_plans')
export class PaymentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column()
  billId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'int' })
  installmentsCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  installmentAmount: number;

  @Column({ default: 'ACTIVE' })
  status: string; // ACTIVE, COMPLETED, DEFAULTED

  @CreateDateColumn()
  createdAt: Date;
}