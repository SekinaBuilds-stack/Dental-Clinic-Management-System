// backend/src/patients/entities/patient.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { PatientMedicalAlert } from './patient-medical-alert.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  fileNumber: string;

  @Column()
  fullName: string;

  @Column()
  gender: string;

  @Column()
  dateOfBirth: string;

  @Column({ unique: true })
  @Index()
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  emergencyContactName: string;

  @Column({ nullable: true })
  emergencyContactPhone: string;

  @Column({ nullable: true })
  referralSource: string;

  @Column({ default: false })
  isPreRegistered: boolean; // Supports TR-PAT-001 pre-registration workflow

  @OneToMany(() => PatientMedicalAlert, (alert) => alert.patient, { cascade: true })
  medicalAlerts: PatientMedicalAlert[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}