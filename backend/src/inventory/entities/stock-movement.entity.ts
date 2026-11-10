import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

export enum MovementType {
  SALE = 'SALE',
  RETURN = 'RETURN',
  GRN = 'GRN',
  ADJUSTMENT = 'ADJUSTMENT',
  CONSUMPTION = 'CONSUMPTION',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem: InventoryItem;

  @Column({ type: 'varchar' })
  inventoryItemId: string;

  @Column({ type: 'int' })
  quantity: number; // Positive for inbound, negative for outbound

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  movementType: MovementType;

  @Column({ type: 'varchar' })
  reference: string; // e.g., POS-SALE-123

  @Column({ type: 'varchar' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}