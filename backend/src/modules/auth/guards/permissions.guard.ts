import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../../common/decorators/require-permissions.decorator.js';
import { AbilityFactory } from '../casl/ability.factory.js';
import { AuthenticatedUser } from '../../../common/types/jwt-payload.types.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @RequirePermissions() on this route → allow (JWT already validated)
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) throw new ForbiddenException('No authenticated user');

    const ability = this.abilityFactory.createForUser(user);

    for (const perm of requiredPermissions) {
      const [action, resource] = perm.split(':');
      if (!ability.can(action, resource)) {
        throw new ForbiddenException(
          `You do not have permission to "${perm}"`,
        );
      }
    }

    return true;
  }
}
