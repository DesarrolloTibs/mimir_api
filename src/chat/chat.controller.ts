import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { PostMessageDto } from './dto/post-message.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post('message')
  @ApiOperation({ summary: 'Post a message to the chat' })
  @ApiResponse({
    status: 201,
    description: 'The message has been successfully posted and a response generated.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  postMessage(@Body() postMessageDto: PostMessageDto) {
    return this.chatService.postMessage(postMessageDto);
  }

  @Get('sessions/project/:projectId')
  @ApiOperation({ summary: 'Get all chat sessions for a project' })
  @ApiResponse({
    status: 200,
    description: 'List of chat sessions for the project.',
  })
  findAllSessionsByProjectId(@Param('projectId') projectId: string) {
    return this.chatService.findAllSessionsByProjectId(projectId);
  }

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Get all messages for a chat session' })
  @ApiResponse({
    status: 200,
    description: 'List of messages for the chat session, including AI citations.',
  })
  findMessagesBySessionId(@Param('sessionId') sessionId: string) {
    return this.chatService.findMessagesBySessionId(sessionId);
  }
}
