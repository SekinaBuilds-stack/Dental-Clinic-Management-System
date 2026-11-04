import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('material_consumptions')
export class MaterialConsumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  treatmentId: string; // Linked to dental treatment/procedure

  @Column()
  inventoryItemId: string;

  @Column({ type: 'int' })
  quantityConsumed: number;

  @Column()
  consumedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}