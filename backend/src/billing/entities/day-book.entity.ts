// backend/src/billing/entities/day-book.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('day_books')
export class DayBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  transactionDate: string;

  @Column()
  referenceId: string; // Bill ID or Receipt ID

  @Column()
  transactionType: string; // PAYMENT, REFUND, EXPENSE

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentMethod: string; // CASH, CARD, MOBILE_MONEY, INSURANCE

  @Column()
  recordedBy: string; // User ID

  @CreateDateColumn()
  createdAt: Date;
}