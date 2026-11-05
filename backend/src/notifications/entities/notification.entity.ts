import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum NotificationType {
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  RECALL_NOTICE = 'RECALL_NOTICE',
  EXPIRY_WARNING = 'EXPIRY_WARNING',
  LOW_STOCK_REORDER = 'LOW_STOCK_REORDER',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  recipientId: string; // User ID or Patient ID

  @CreateDateColumn()
  createdAt: Date;
}