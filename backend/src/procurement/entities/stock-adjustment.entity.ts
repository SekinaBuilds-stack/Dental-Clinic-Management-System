import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AdjustmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('stock_adjustments')
export class StockAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inventoryItemId: string;

  @Column({ type: 'int' })
  adjustmentQuantity: number; // Positive or negative

  @Column()
  reasonCode: string; // e.g., DAMAGED, EXPIRED, COUNT_DISCREPANCY

  @Column({ type: 'enum', enum: AdjustmentStatus, default: AdjustmentStatus.PENDING })
  status: AdjustmentStatus;

  @Column()
  requestedByUserId: string;

  @Column({ nullable: true })
  approvedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}