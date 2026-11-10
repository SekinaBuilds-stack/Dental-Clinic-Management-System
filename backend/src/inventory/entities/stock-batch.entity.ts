import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

@Entity('stock_batches')
export class StockBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  inventoryItemId: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem: InventoryItem;

  @Column({ type: 'varchar', unique: true })
  batchNumber: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'date' })
  expiryDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}