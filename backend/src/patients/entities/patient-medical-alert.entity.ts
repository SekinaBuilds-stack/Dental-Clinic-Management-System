// backend/src/patients/entities/patient-medical-alert.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('patient_medical_alerts')
export class PatientMedicalAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  alertType: string; // e.g., 'Allergy', 'Anesthesia Sensitivity', 'Condition'

  @Column()
  severity: string; // e.g., 'High', 'Moderate', 'Low'

  @Column()
  description: string; // e.g., 'Penicillin allergy', 'Latex sensitivity'

  @ManyToOne(() => Patient, (patient) => patient.medicalAlerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
