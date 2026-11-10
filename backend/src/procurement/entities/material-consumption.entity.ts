import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('material_consumptions')
export class MaterialConsumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  treatmentId: string; // Linked to dental treatment/procedure

  @Column({ type: 'varchar' })
  inventoryItemId: string;

  @Column({ type: 'int' })
  quantityConsumed: number;

  @Column({ type: 'varchar' })
  consumedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}