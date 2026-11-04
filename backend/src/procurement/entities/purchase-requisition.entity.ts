import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum RequisitionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONVERTED_TO_PO = 'CONVERTED_TO_PO',
}

@Entity('purchase_requisitions')
export class PurchaseRequisition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  requisitionNumber: string;

  @Column()
  inventoryItemId: string;

  @Column({ type: 'int' })
  quantityRequested: number;

  @Column({ type: 'enum', enum: RequisitionStatus, default: RequisitionStatus.PENDING })
  status: RequisitionStatus;

  @Column()
  requestedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}