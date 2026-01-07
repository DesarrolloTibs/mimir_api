import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ example: false, description: 'Estado de activación del usuario' })
  @IsBoolean()
  isActive: boolean;
}
