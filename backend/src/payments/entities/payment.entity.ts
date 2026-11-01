// backend/src/payments/entities/payment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Bill } from '../../billing/entities/bill.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  billId: string;

  @ManyToOne(() => Bill, { onDelete: 'CASCADE' })
  bill: Bill;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentMethod: string; // CASH, CARD, MOBILE_MONEY, INSURANCE

  @Column({ nullable: true })
  transactionReference: string;

  @Column()
  receivedBy: string; // Cashier User ID

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('payment_reversals')
export class PaymentReversal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  paymentId: string;

  @Column()
  reason: string;

  @Column()
  approvedBy: string; // Manager User ID

  @CreateDateColumn()
  createdAt: Date;
}