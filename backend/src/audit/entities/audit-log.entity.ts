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

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  userEmail: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'varchar' })
  entityName: string;

  @Column({ type: 'varchar', nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  beforeValue: any;

  @Column({ type: 'jsonb', nullable: true })
  afterValue: any;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}