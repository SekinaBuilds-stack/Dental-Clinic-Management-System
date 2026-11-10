import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('day_books')
export class DayBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  transactionDate: string;

  @Column({ type: 'varchar' })
  referenceId: string; // Bill ID or Receipt ID

  @Column({ type: 'varchar' })
  transactionType: string; // PAYMENT, REFUND, EXPENSE

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar' })
  paymentMethod: string; // CASH, CARD, MOBILE_MONEY, INSURANCE

  @Column({ type: 'varchar' })
  recordedBy: string; // User ID

  @CreateDateColumn()
  createdAt: Date;
}