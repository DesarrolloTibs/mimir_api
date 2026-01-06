import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Requirement } from './requirement.entity';

@Entity('estimation_items')
export class EstimationItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Requirement, (req) => req.estimationItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_id' })
  requirement: Requirement;

  @Column({ type: 'uuid', name: 'requirement_id' })
  requirementId: string;

  @Column({ name: 'task_description', type: 'varchar', length: 500 })
  taskDescription: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  layer: string;

  @Column({ name: 'ai_suggested_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  aiSuggestedHours: number;

  @Column({ name: 'ai_confidence_score', type: 'int', nullable: true })
  aiConfidenceScore: number;

  @Column({ name: 'ai_reasoning', type: 'text', nullable: true })
  aiReasoning: string;

  @Column({ name: 'human_adjusted_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  humanAdjustedHours: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
