// backend/src/patients/entities/patient.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { PatientMedicalAlert } from './patient-medical-alert.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  fileNumber: string;

  @Column({ type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar' })
  gender: string;

  @Column({ type: 'varchar' })
  dateOfBirth: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  phoneNumber: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  emergencyContactName: string;

  @Column({ type: 'varchar', nullable: true })
  emergencyContactPhone: string;

  @Column({ type: 'varchar', nullable: true })
  referralSource: string;

  @Column({ type: 'boolean', default: false })
  isPreRegistered: boolean; // Supports TR-PAT-001 pre-registration workflow

  @OneToMany(() => PatientMedicalAlert, (alert) => alert.patient, { cascade: true })
  medicalAlerts: PatientMedicalAlert[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}