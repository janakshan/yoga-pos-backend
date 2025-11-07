import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, LoginPinDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.usersService.findByEmailOrUsername(
      registerDto.email,
      registerDto.username,
    );

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async loginWithPin(loginPinDto: LoginPinDto) {
    const user = await this.usersService.findByUsername(loginPinDto.username);

    if (!user || !user.pin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if PIN is locked
    if (user.pinLockedUntil && new Date() < user.pinLockedUntil) {
      throw new UnauthorizedException('PIN is locked. Please try again later.');
    }

    const isPinValid = await bcrypt.compare(loginPinDto.pin, user.pin);

    if (!isPinValid) {
      await this.usersService.incrementPinAttempts(user.id);
      throw new UnauthorizedException('Invalid PIN');
    }

    // Reset PIN attempts on successful login
    await this.usersService.resetPinAttempts(user.id);
    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get('auth.jwtRefreshSecret'),
      });

      const user = await this.usersService.findOne(payload.sub);

      if (!user || user.refreshToken !== refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async setPin(userId: string, newPin: string) {
    const hashedPin = await bcrypt.hash(newPin, 10);
    await this.usersService.updatePin(userId, hashedPin);
    return { success: true, message: 'PIN set successfully' };
  }

  async disablePin(userId: string) {
    await this.usersService.updatePin(userId, null);
    return { success: true, message: 'PIN disabled successfully' };
  }

  async resetPinAttempts(userId: string) {
    await this.usersService.resetPinAttempts(userId);
    return { success: true, message: 'PIN attempts reset successfully' };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('auth.jwtSecret'),
        expiresIn: this.configService.get('auth.jwtExpiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('auth.jwtRefreshSecret'),
        expiresIn: this.configService.get('auth.jwtRefreshExpiration'),
      }),
    ]);

    return {
      token: accessToken,
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
    };
  }

  private sanitizeUser(user: User) {
    const { password, pin, refreshToken, pinAttempts, pinLockedUntil, ...sanitizedUser } = user;
    return {
      ...sanitizedUser,
      roles: user.roles?.map((role) => role.code) || [],
      permissions: user.roles?.flatMap((role) => role.permissions.map((p) => p.code)) || [],
    };
  }
}
