import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: true, description: 'Estado de activación del usuario', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}