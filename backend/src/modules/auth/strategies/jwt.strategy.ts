import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '../../../common/types/jwt-payload.types.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'fallback_secret',
    });
  }

  /**
   * Called after JWT signature is verified.
   * The returned value is attached to req.user.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId:            payload.sub,
      employeeId:        payload.employeeId,
      email:             payload.email,
      roles:             payload.roles,
      scopes:            payload.scopes,
      mustChangePassword: payload.mustChangePassword,
    };
  }
}
