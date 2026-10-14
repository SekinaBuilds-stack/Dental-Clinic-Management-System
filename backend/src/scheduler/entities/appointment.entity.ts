// backend/src/scheduler/entities/appointment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from './doctor.entity';
import { TreatmentChair } from './treatment-chair.entity';

export enum AppointmentStatus {
  BOOKED = 'Booked',
  CONFIRMED = 'Confirmed',
  CHECKED_IN = 'Checked-In',
  IN_TREATMENT = 'In Treatment',
  COMPLETED = 'Completed',
  NO_SHOW = 'No-Show',
  CANCELLED = 'Cancelled',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => Doctor, { eager: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column({ type: 'uuid' })
  chairId: string;

  @ManyToOne(() => TreatmentChair, { eager: true })
  @JoinColumn({ name: 'chairId' })
  chair: TreatmentChair;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.BOOKED,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}