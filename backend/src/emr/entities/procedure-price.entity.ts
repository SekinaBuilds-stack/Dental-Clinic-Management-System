// backend/src/emr/entities/procedure-price.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProcedureCatalog } from './procedure-catalog.entity';

@Entity('procedure_prices')
export class ProcedurePrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  procedureId: string;

  @ManyToOne(() => ProcedureCatalog, (catalog: ProcedureCatalog) => catalog.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'procedureId' })
  procedure: ProcedureCatalog;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ length: 50, default: 'Standard' })
  tier: string;
}