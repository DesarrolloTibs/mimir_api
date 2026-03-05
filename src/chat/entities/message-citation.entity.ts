import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { DocumentChunk } from '../../documents/entities/document-chunk.entity';

@Entity('message_citations')
export class MessageCitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ChatMessage, (message) => message.citations, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'message_id' })
    message: ChatMessage;

    @Column({ type: 'uuid', name: 'message_id' })
    messageId: string;

    @ManyToOne(() => DocumentChunk, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'document_chunk_id' })
    documentChunk: DocumentChunk;

    @Column({ type: 'uuid', name: 'document_chunk_id', nullable: true })
    documentChunkId: string;

    @Column({ type: 'float', name: 'relevance_score', nullable: true })
    relevanceScore: number;
}
