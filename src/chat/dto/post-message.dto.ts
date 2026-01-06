import { IsString, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PostMessageDto {
  @ApiProperty({
    description: 'The ID of the project for the chat',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'The ID of the chat session to continue a conversation',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    description: 'The user message',
    example: 'What is the database schema for users?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
