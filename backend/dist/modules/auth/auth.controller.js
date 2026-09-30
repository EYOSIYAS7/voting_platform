var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, Get, Delete, Body, Param, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { UserAccount } from './entities/user-account.entity.js';
import { LoginDto, ChangePasswordDto, CreateAccountDto, AssignRoleDto, TokenResponseDto, } from './dto/auth.dto.js';
import { WalletChallengeDto, WalletVerifyDto } from './dto/wallet.dto.js';
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(_dto, account) {
        return this.authService.login(account);
    }
    getMe(user) {
        return this.authService.getProfile(user);
    }
    changePassword(userId, dto) {
        return this.authService.changePassword(userId, dto);
    }
    requestChallenge(employeeId, dto) {
        return this.authService.requestWalletChallenge(employeeId, dto.walletAddress);
    }
    verifyWallet(employeeId, dto) {
        return this.authService.verifyWalletSignature(employeeId, dto.walletAddress, dto.challenge, dto.signature);
    }
    getWallet(employeeId) {
        return this.authService.getActiveWalletBinding(employeeId);
    }
    revokeWallet(bindingId, userId) {
        return this.authService.revokeWalletBinding(bindingId, userId);
    }
    createAccount(dto, adminId) {
        return this.authService.createAccount(dto, adminId);
    }
    assignRole(dto, adminId) {
        return this.authService.assignRole(dto, adminId);
    }
    revokeRole(scopeId, adminId) {
        return this.authService.revokeRole(scopeId, adminId);
    }
    getRoles() {
        return this.authService.getAllRoles();
    }
    getUserRoles(userId) {
        return this.authService.getUserRoles(userId);
    }
};
__decorate([
    Public(),
    UseGuards(LocalAuthGuard),
    Post('login'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Login with email and password — returns JWT access token' }),
    ApiResponse({ status: 200, type: TokenResponseDto }),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto,
        UserAccount]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    ApiBearerAuth(),
    Get('me'),
    ApiOperation({ summary: 'Get the current authenticated user profile' }),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    ApiBearerAuth(),
    Post('change-password'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Change own password (required on first login)' }),
    __param(0, CurrentUser('userId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ChangePasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "changePassword", null);
__decorate([
    ApiBearerAuth(),
    Post('wallet/challenge'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Request a SIWE challenge nonce to sign with your wallet' }),
    __param(0, CurrentUser('employeeId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, WalletChallengeDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestChallenge", null);
__decorate([
    ApiBearerAuth(),
    Post('wallet/verify'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Submit signed challenge to verify wallet ownership and bind it' }),
    __param(0, CurrentUser('employeeId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, WalletVerifyDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyWallet", null);
__decorate([
    ApiBearerAuth(),
    Get('wallet'),
    ApiOperation({ summary: 'Get your active verified wallet binding' }),
    __param(0, CurrentUser('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getWallet", null);
__decorate([
    ApiBearerAuth(),
    Delete('wallet/:bindingId'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Revoke a wallet binding' }),
    __param(0, Param('bindingId', ParseUUIDPipe)),
    __param(1, CurrentUser('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "revokeWallet", null);
__decorate([
    ApiBearerAuth(),
    UseGuards(PermissionsGuard),
    Post('accounts'),
    RequirePermissions('create:employee'),
    ApiOperation({ summary: '[ADMIN] Create a login account for an employee' }),
    __param(0, Body()),
    __param(1, CurrentUser('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateAccountDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "createAccount", null);
__decorate([
    ApiBearerAuth(),
    UseGuards(PermissionsGuard),
    Post('roles/assign'),
    RequirePermissions('manage:organization'),
    ApiOperation({ summary: '[ADMIN] Assign a role (optionally scoped) to a user' }),
    __param(0, Body()),
    __param(1, CurrentUser('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AssignRoleDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "assignRole", null);
__decorate([
    ApiBearerAuth(),
    UseGuards(PermissionsGuard),
    Delete('roles/scopes/:scopeId'),
    HttpCode(HttpStatus.NO_CONTENT),
    RequirePermissions('manage:organization'),
    ApiOperation({ summary: '[ADMIN] Revoke a role scope from a user' }),
    __param(0, Param('scopeId', ParseUUIDPipe)),
    __param(1, CurrentUser('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "revokeRole", null);
__decorate([
    ApiBearerAuth(),
    Get('roles'),
    ApiOperation({ summary: 'List all available system roles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getRoles", null);
__decorate([
    ApiBearerAuth(),
    UseGuards(PermissionsGuard),
    Get('users/:userId/roles'),
    RequirePermissions('read:employee'),
    ApiOperation({ summary: '[ADMIN] Get all role scopes for a user' }),
    __param(0, Param('userId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getUserRoles", null);
AuthController = __decorate([
    ApiTags('Auth'),
    Controller('auth'),
    __metadata("design:paramtypes", [AuthService])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map