import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RetailSale } from './retail-sale.entity';

@Entity('retail_returns')
export class RetailReturn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RetailSale, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'retailSaleId' })
  retailSale: RetailSale;

  @Column({ type: 'varchar' })
  retailSaleId: string;

  @Column({ type: 'varchar' })
  retailProductId: string;

  @Column({ type: 'int' })
  returnQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  refundAmount: number;

  @Column({ type: 'varchar' })
  reason: string;

  @Column({ type: 'varchar' })
  approvedByUserId: string; // Manager authorization ID

  @CreateDateColumn()
  createdAt: Date;
}