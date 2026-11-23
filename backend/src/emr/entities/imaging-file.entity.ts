import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// FR-EMR-007 / TR-EMR-007: metadata for X-rays and photos stored in S3-compatible storage
@Entity('imaging_files')
export class ImagingFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  patientId: string;

  @Column({ type: 'varchar' })
  fileUrl: string;

  @Column({ type: 'varchar' })
  fileName: string;

  @Column({ type: 'int', nullable: true })
  toothNumber: number | null;

  @Column({ type: 'varchar', nullable: true })
  imagingType: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
