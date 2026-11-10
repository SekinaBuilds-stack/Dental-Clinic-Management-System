import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Bill } from '../../billing/entities/bill.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  billId: string;

  @ManyToOne(() => Bill, { onDelete: 'CASCADE' })
  bill: Bill;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar' })
  paymentMethod: string; // CASH, CARD, MOBILE_MONEY, INSURANCE

  @Column({ type: 'varchar', nullable: true })
  transactionReference: string;

  @Column({ type: 'varchar' })
  receivedBy: string; // Cashier User ID

  @CreateDateColumn()
  createdAt: Date;
}