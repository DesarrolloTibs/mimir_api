import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { Observable } from 'rxjs';
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

  @Post('message-stream')
  @ApiOperation({ summary: 'Post a message to the chat and receive a streaming response' })
  postMessageStream(@Body() postMessageDto: PostMessageDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const subscription = this.chatService.postMessageStream(postMessageDto).subscribe({
      next: (item) => {
        res.write(`data: ${JSON.stringify(item.data)}\n\n`);
      },
      error: (error) => {
        console.error('Stream error:', error);
        res.end();
      },
      complete: () => {
        res.end();
      }
    });

    res.on('close', () => {
      subscription.unsubscribe();
    });
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
