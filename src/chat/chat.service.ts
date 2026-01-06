import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, ChatMessageRole } from './entities/chat-message.entity';
import { PostMessageDto } from './dto/post-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async postMessage(postMessageDto: PostMessageDto) {
    const { projectId, sessionId, message } = postMessageDto;

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
    }

    // 1. Save user message
    const userMessage = this.chatMessageRepository.create({
      sessionId: session.id,
      role: ChatMessageRole.USER,
      content: message,
    });
    await this.chatMessageRepository.save(userMessage);

    // 2. Mock AI response
    const mockAiResponse = {
      answer: 'El campo RFC es varchar(13) y requiere validación regex.',
      citations: [
        { docName: 'DiccionarioDatos.pdf', page: 12, similarity: 0.89 },
      ],
    };

    // 3. Save assistant message
    const assistantMessage = this.chatMessageRepository.create({
      sessionId: session.id,
      role: ChatMessageRole.ASSISTANT,
      content: mockAiResponse.answer,
      // In a real implementation, you would also save citation data
    });
    await this.chatMessageRepository.save(assistantMessage);

    // 4. Return response
    return {
      ...mockAiResponse,
      sessionId: session.id,
    };
  }
}
