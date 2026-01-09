import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, ChatMessageRole } from './entities/chat-message.entity';
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
    private readonly geminiService: GeminiService,
    private readonly documentsService: DocumentsService,
  ) {}

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

    // 2. Get document chunks
    const chunks = await this.documentsService.getProjectChunks(projectId);

    // 3. Generate AI response
    const aiResponse = await this.geminiService.generateChatResponse(
      message,
      chunks,
    );

    // 4. Save assistant message
    const assistantMessage = this.chatMessageRepository.create({
      sessionId: session.id,
      role: ChatMessageRole.ASSISTANT,
      content: aiResponse,
    });
    await this.chatMessageRepository.save(assistantMessage);

    // 5. Return response
    return {
      answer: aiResponse,
      sessionId: session.id,
    };
  }
}
