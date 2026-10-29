// backend/src/emr/entities/procedure-catalog.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ProcedurePrice } from './procedure-price.entity';

@Entity('procedure_catalog')
export class ProcedureCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string; // e.g., "PROV-001"

  @Column({ length: 150 })
  name: string; // e.g., "Composite Restoration - 1 Surface"

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => ProcedurePrice, (price) => price.procedure)
  prices: ProcedurePrice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}