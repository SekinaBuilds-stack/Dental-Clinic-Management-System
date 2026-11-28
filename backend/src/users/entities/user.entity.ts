import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'DEACTIVATED';

// Table name is "app_users" so it can never clash with an old "users" table from the earlier seed migration.
@Entity('app_users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar' })
  fullName: string;

  /** null until an administrator approves the account and assigns a role */
  @Column({ type: 'varchar', nullable: true })
  role: string | null;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: UserStatus;

  @Column({ type: 'varchar', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
