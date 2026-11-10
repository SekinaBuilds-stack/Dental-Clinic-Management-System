import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Payment } from './payment.entity';

@Entity('payment_reversals')
export class PaymentReversal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ type: 'varchar' })
  paymentId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar' })
  reason: string;

  @Column({ type: 'varchar' })
  approvedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}