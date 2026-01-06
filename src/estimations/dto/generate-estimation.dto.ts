import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateEstimationDto {
  @ApiProperty({
    description: 'The ID of the project for which to generate an estimation',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'The requirement text in natural language',
    example: 'I need a login with Google',
  })
  @IsString()
  @IsNotEmpty()
  requirement: string;
}
