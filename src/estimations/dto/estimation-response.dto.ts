import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsInt, IsArray, ValidateNested, IsNumber } from 'class-validator';

export class EstimationTaskDto {
  @ApiProperty({ description: 'Detailed description of the task' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'The layer the task belongs to (e.g., Backend, Frontend)' })
  @IsString()
  layer: string;

  @ApiProperty({ description: 'Suggested hours for the task' })
  @IsNumber()
  hours: number;

  @ApiProperty({ description: 'Reasoning behind the estimation' })
  @IsString()
  reason: string;
}

export class EstimationResponseDto {
  @ApiProperty({ description: 'A summary of the estimation' })
  @IsString()
  summary: string;

  @ApiProperty({ type: [EstimationTaskDto], description: 'List of tasks for the estimation' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EstimationTaskDto)
  tasks: EstimationTaskDto[];

  @ApiProperty({ description: 'Total estimated hours' })
  @IsNumber()
  totalHours: number;

  @ApiProperty({ description: 'Confidence score of the estimation (0-100)' })
  @IsInt()
  confidenceScore: number;
}
