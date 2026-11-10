import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  sku: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  category: string; // CONSUMABLE, EQUIPMENT, RETAIL

  @Column({ type: 'int', default: 0 })
  currentStock: number;

  @Column({ type: 'int', default: 5 })
  minStockLevel: number;

  @Column({ type: 'varchar', default: 'pcs' })
  unit: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}