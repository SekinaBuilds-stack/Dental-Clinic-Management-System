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

  @Column({ type: 'varchar' })
  inventoryItemId: string;

  @Column({ type: 'int' })
  adjustmentQuantity: number; // Positive or negative

  @Column({ type: 'varchar' })
  reasonCode: string; // e.g., DAMAGED, EXPIRED, COUNT_DISCREPANCY

  @Column({ type: 'enum', enum: AdjustmentStatus, default: AdjustmentStatus.PENDING })
  status: AdjustmentStatus;

  @Column({ type: 'varchar' })
  requestedByUserId: string;

  @Column({ type: 'varchar', nullable: true })
  approvedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}