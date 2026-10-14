// backend/src/scheduler/entities/treatment-chair.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity('treatment_chairs')
export class TreatmentChair {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // e.g. "Chair 1 - Ortho Suite"

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status: string; // Active, Maintenance, Out of Service

  @OneToMany(() => Appointment, (appointment) => appointment.chair)
  appointments: Appointment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}