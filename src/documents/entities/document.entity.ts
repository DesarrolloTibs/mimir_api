import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

import { DocumentStatus } from './document-status.enum';
import { DocumentChunk } from './document-chunk.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath: string;

  @Column({ name: 'file_type', type: 'varchar', length: 50 })
  fileType: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
    name: 'processing_status',
  })
  processingStatus: DocumentStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @Column({ type: 'uuid', name: 'uploaded_by', nullable: true })
  uploadedById: string;

  @OneToMany(() => DocumentChunk, (chunk) => chunk.document)
  chunks: DocumentChunk[];
}
