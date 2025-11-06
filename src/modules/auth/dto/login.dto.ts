import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@yoga.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin123', description: 'User password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: true, description: 'Remember me flag' })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}

export class LoginPinDto {
  @ApiProperty({ example: 'admin', description: 'Username' })
  @IsString()
  username: string;

  @ApiProperty({ example: '1234', description: 'PIN code', minLength: 4 })
  @IsString()
  @MinLength(4)
  pin: string;

  @ApiPropertyOptional({ example: false, description: 'Remember me flag' })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh_token_here', description: 'Refresh token' })
  @IsString()
  refreshToken: string;
}
