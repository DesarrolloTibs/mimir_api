import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { PostMessageDto } from './dto/post-message.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
}
