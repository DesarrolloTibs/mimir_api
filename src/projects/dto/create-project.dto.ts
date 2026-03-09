import { IsString, MinLength, MaxLength, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({
    description: 'The client for the project',
    example: 'ACME Inc.',
  })
  @IsString()
  @IsOptional()
  clientName?: string;

  @ApiProperty({
    description: 'The technology stack of the project',
    example: 'NestJS, React, PostgreSQL',
  })
  @IsString()
  @IsNotEmpty()
  techStackContext: string;

  @ApiPropertyOptional({
    description: 'The description of the project',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'The status of the project',
    example: 'Active',
  })
  @IsString()
  @IsOptional()
  status?: string;
}
