import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// FR-EMR-008 / TR-EMR-008: signed digital consent for procedures
@Entity('consents')
export class Consent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  patientId: string;

  @Column({ type: 'varchar' })
  procedureName: string;

  @Column({ type: 'text' })
  signatureData: string;

  @Column({ type: 'varchar' })
  signedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
