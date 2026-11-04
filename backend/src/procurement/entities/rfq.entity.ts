import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseRequisition } from './purchase-requisition.entity';
import { Supplier } from '../../inventory/entities/supplier.entity';

@Entity('rfqs')
export class Rfq {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requisitionId: string;

  @ManyToOne(() => PurchaseRequisition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requisitionId' })
  requisition: PurchaseRequisition;

  @Column()
  supplierId: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quotedPrice: number;

  @Column({ default: 'SENT' })
  status: string; // SENT, RECEIVED, ACCEPTED

  @CreateDateColumn()
  createdAt: Date;
}