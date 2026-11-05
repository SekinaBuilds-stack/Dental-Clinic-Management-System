import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVAL = 'APPROVAL',
  REVERSAL = 'REVERSAL',
  LOGIN = 'LOGIN',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column()
  entityName: string;

  @Column({ nullable: true })
  entityId: string;

  @Column('jsonb', { nullable: true })
  beforeValue: any;

  @Column('jsonb', { nullable: true })
  afterValue: any;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}