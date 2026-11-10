import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

@Entity('retail_products')
export class RetailProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  sku: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  barcode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  retailPrice: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToOne(() => InventoryItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem: InventoryItem;

  @Column({ type: 'varchar' })
  inventoryItemId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}