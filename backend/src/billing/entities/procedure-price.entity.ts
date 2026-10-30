// backend/src/billing/entities/procedure-price.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ProcedureCatalog } from '../../emr/entities/procedure-catalog.entity';

@Entity('procedure_prices')
export class ProcedurePrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  procedureId: string;

  @ManyToOne(() => ProcedureCatalog, { onDelete: 'CASCADE' })
  procedure: ProcedureCatalog;

  @Column({ nullable: true })
  toothNumber: number; // Tooth-specific pricing tier if applicable

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;
}