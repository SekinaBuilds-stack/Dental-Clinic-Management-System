import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// FR-EMR-003 / TR-EMR-003: progress notes per visit and procedure
@Entity('clinical_notes')
export class ClinicalNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  patientId: string;

  @Column({ type: 'varchar', nullable: true })
  visitId: string | null;

  @Column({ type: 'int', nullable: true })
  toothNumber: number | null;

  @Column({ type: 'text' })
  notes: string;

  @Column({ type: 'varchar' })
  diagnosis: string;

  @CreateDateColumn()
  createdAt: Date;
}
