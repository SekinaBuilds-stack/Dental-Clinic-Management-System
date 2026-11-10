import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

export enum RetailSaleStatus {
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

@Entity('retail_sales')
export class RetailSale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  receiptNumber: string;

  @Column({ type: 'varchar', nullable: true })
  patientId: string; // Optional link if sold to a registered patient

  @Column({ type: 'varchar' })
  cashierId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar' })
  paymentMethod: string; // CASH, CARD, MOBILE_MONEY

  @Column({
    type: 'enum',
    enum: RetailSaleStatus,
    default: RetailSaleStatus.COMPLETED,
  })
  status: RetailSaleStatus;

  @OneToMany(() => RetailSaleItem, (item) => item.retailSale, { cascade: true })
  items: RetailSaleItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('retail_sale_items')
export class RetailSaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RetailSale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'retailSaleId' })
  retailSale: RetailSale;

  @Column({ type: 'varchar' })
  retailSaleId: string;

  @Column({ type: 'varchar' })
  retailProductId: string;

  @Column({ type: 'varchar' })
  productName: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;
}