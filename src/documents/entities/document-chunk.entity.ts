import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from './document.entity';

@Entity('document_chunks')
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, (document) => document.chunks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ type: 'int' })
  chunkIndex: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({
    type: 'vector',
    transformer: {
      from: (value: string) => JSON.parse(value),
      to: (value: number[]) => JSON.stringify(value),
    },
  })
  embedding: number[];
}
