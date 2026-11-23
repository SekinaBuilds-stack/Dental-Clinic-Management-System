import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export interface PrescriptionItem {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

// FR-EMR-004 / TR-EMR-004: medication prescribing
@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  patientId: string;

  @Column({ type: 'varchar' })
  prescriberId: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  items: PrescriptionItem[];

  @CreateDateColumn()
  createdAt: Date;
}
