import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { UserAccount } from './entities/user-account.entity.js';
import type { AuthenticatedUser } from '../../common/types/jwt-payload.types.js';
import {
  LoginDto,
  ChangePasswordDto,
  CreateAccountDto,
  AssignRoleDto,
  TokenResponseDto,
} from './dto/auth.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Public Endpoints ──────────────────────────────────────────────────────

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password — returns JWT access token' })
  @ApiResponse({ status: 200, type: TokenResponseDto })
  async login(
    @Body() _dto: LoginDto,        // validated by LocalAuthGuard before reaching here
    @CurrentUser() account: UserAccount,
  ): Promise<TokenResponseDto> {
    return this.authService.login(account);
  }

  // ── Authenticated Endpoints ───────────────────────────────────────────────

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<object> {
    return this.authService.getProfile(user);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password (required on first login)' })
  changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  // ── Admin-only Role Management ────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Post('accounts')
  @RequirePermissions('create:employee')
  @ApiOperation({ summary: '[ADMIN] Create a login account for an employee' })
  createAccount(
    @Body() dto: CreateAccountDto,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.authService.createAccount(dto, adminId);
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Post('roles/assign')
  @RequirePermissions('manage:organization')
  @ApiOperation({ summary: '[ADMIN] Assign a role (optionally scoped) to a user' })
  assignRole(
    @Body() dto: AssignRoleDto,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.authService.assignRole(dto, adminId);
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Delete('roles/scopes/:scopeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('manage:organization')
  @ApiOperation({ summary: '[ADMIN] Revoke a role scope from a user' })
  revokeRole(
    @Param('scopeId', ParseUUIDPipe) scopeId: string,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.authService.revokeRole(scopeId, adminId);
  }

  @ApiBearerAuth()
  @Get('roles')
  @ApiOperation({ summary: 'List all available system roles' })
  getRoles() {
    return this.authService.getAllRoles();
  }

  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @Get('users/:userId/roles')
  @RequirePermissions('read:employee')
  @ApiOperation({ summary: '[ADMIN] Get all role scopes for a user' })
  getUserRoles(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.authService.getUserRoles(userId);
  }
}
