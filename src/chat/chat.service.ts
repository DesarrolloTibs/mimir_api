import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, ChatMessageRole } from './entities/chat-message.entity';
import { MessageCitation } from './entities/message-citation.entity';
import { PostMessageDto } from './dto/post-message.dto';
import { GeminiService } from 'src/common/gemini.service';
import { DocumentsService } from 'src/documents/documents.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(MessageCitation)
    private readonly messageCitationRepository: Repository<MessageCitation>,
    private readonly geminiService: GeminiService,
    private readonly documentsService: DocumentsService,
  ) { }

  async postMessage(postMessageDto: PostMessageDto) {
    const { projectId, sessionId, message } = postMessageDto;

    let session: ChatSession | null = null;

    if (sessionId) {
      session = await this.chatSessionRepository.findOneBy({
        id: sessionId,
        projectId,
      });
    }

    if (!session) {
      session = this.chatSessionRepository.create({
        projectId,
        title: `Chat session started at ${new Date().toISOString()}`,
      });
      await this.chatSessionRepository.save(session);
    }

    // 1. Save user message
    const userMessage = this.chatMessageRepository.create({
      sessionId: session.id,
      role: ChatMessageRole.USER,
      content: message,
    });
    await this.chatMessageRepository.save(userMessage);

    // 2. Generate embedding for query & Vector Search
    const queryEmbedding = await this.geminiService.generateEmbedding(message);
    const chunks = await this.documentsService.getRelevantProjectChunks(
      projectId,
      queryEmbedding,
      5, // top 5 most relevant chunks
    );

    // 3. Generate AI response with citations
    const aiResponse = await this.geminiService.generateChatResponse(
      message,
      chunks,
    );

    // 4. Save assistant message
    const assistantMessage = this.chatMessageRepository.create({
      sessionId: session.id,
      role: ChatMessageRole.ASSISTANT,
      content: aiResponse.answer,
    });
    await this.chatMessageRepository.save(assistantMessage);

    // 5. Save citations
    if (aiResponse.citations && aiResponse.citations.length > 0) {
      const citationsToSave = aiResponse.citations.map((c) =>
        this.messageCitationRepository.create({
          messageId: assistantMessage.id,
          documentChunkId: c.chunkId,
        }),
      );
      await this.messageCitationRepository.save(citationsToSave);
    }

    // 6. Return response
    return {
      answer: aiResponse.answer,
      sessionId: session.id,
      citations: aiResponse.citations,
    };
  }

  async findAllSessionsByProjectId(projectId: string): Promise<ChatSession[]> {
    return this.chatSessionRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      relations: ['citations'], // Include citations in the response
    });
  }

  postMessageStream(postMessageDto: PostMessageDto): Observable<any> {
    const { projectId, sessionId, message } = postMessageDto;

    return new Observable((subscriber) => {
      (async () => {
        try {
          let session: ChatSession | null = null;
          if (sessionId) {
            session = await this.chatSessionRepository.findOneBy({ id: sessionId, projectId });
          }
          if (!session) {
            session = this.chatSessionRepository.create({
              projectId,
              title: `Chat session started at ${new Date().toISOString()}`,
            });
            await this.chatSessionRepository.save(session);
            subscriber.next({ data: { type: 'session_created', sessionId: session.id } });
          }

          // 1. Save user message
          const userMessage = this.chatMessageRepository.create({
            sessionId: session.id,
            role: ChatMessageRole.USER,
            content: message,
          });
          await this.chatMessageRepository.save(userMessage);

          // 2. Generate embedding for query & Vector Search
          subscriber.next({ data: { type: 'status', message: 'Buscando información relevante...' } });
          const queryEmbedding = await this.geminiService.generateEmbedding(message);
          const chunks = await this.documentsService.getRelevantProjectChunks(
            projectId,
            queryEmbedding,
            5,
          );

          // 3. Generate AI response stream
          subscriber.next({ data: { type: 'status', message: 'Generando respuesta...' } });
          const streamResult = await this.geminiService.generateChatResponseStream(message, chunks);

          let fullResponse = '';
          for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            subscriber.next({ data: { type: 'token', text: chunkText } });
          }

          // 4. Parse citations from the stream's end (if we asked for it)
          let cleanAnswer = fullResponse;
          let citationIds: string[] = [];

          const citationMatch = fullResponse.match(/CITATIONS:\s*\[(.*?)\]/m);
          if (citationMatch) {
            const idsStr = citationMatch[1];
            citationIds = idsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);
            cleanAnswer = fullResponse.replace(/CITATIONS:\s*\[(.*?)\]/m, '').trim();
          }

          // 5. Save assistant message
          const assistantMessage = this.chatMessageRepository.create({
            sessionId: session.id,
            role: ChatMessageRole.ASSISTANT,
            content: cleanAnswer,
          });
          await this.chatMessageRepository.save(assistantMessage);

          // 6. Save citations
          let savedCitations: MessageCitation[] = [];
          if (citationIds.length > 0) {
            const citationsToSave = citationIds.map((chunkId) =>
              this.messageCitationRepository.create({
                messageId: assistantMessage.id,
                documentChunkId: chunkId,
              }),
            );
            savedCitations = await this.messageCitationRepository.save(citationsToSave);
          }

          // 7. Finish
          subscriber.next({
            data: {
              type: 'done',
              sessionId: session.id,
              finalAnswer: cleanAnswer,
              citations: savedCitations
            }
          });
          subscriber.complete();

        } catch (error) {
          console.error('Error streaming chat:', error);
          subscriber.error(error);
        }
      })();
    });
  }
}

