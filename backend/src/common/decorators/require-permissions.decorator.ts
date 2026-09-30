import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declare required permissions on a route handler.
 * Checked by PermissionsGuard after JWT validation.
 *
 * Usage:
 *   @RequirePermissions('create:election')
 *   @Post()
 *   createElection() { ... }
 *
 *   @RequirePermissions('read:election', 'read:result')
 *   @Get(':id/results')
 *   getResults() { ... }
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
