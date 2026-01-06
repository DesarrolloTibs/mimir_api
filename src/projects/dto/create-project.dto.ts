import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'The name of the project',
    minLength: 5,
    maxLength: 50,
    example: 'Mimir Project',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'The client for the project',
    example: 'ACME Inc.',
  })
  @IsString()
  client: string;

  @ApiProperty({
    description: 'The technology stack of the project',
    example: 'NestJS, React, PostgreSQL',
  })
  @IsString()
  @IsNotEmpty()
  techStack: string;
}
