import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { EstimationItem } from './estimation-item.entity';

@Entity('requirements')
export class Requirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project: Project) => project.requirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'original_text', type: 'text', nullable: true })
  originalText: string;

  @Column({ type: 'varchar', length: 50, default: 'Identified' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => EstimationItem, (item) => item.requirement)
  estimationItems: EstimationItem[];
}
