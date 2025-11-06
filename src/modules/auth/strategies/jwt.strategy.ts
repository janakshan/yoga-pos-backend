import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwtSecret'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.code),
      permissions: user.roles.flatMap((role) =>
        role.permissions.map((permission) => permission.code),
      ),
    };
  }
}
