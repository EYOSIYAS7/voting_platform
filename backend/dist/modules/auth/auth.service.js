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
import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { verifyMessage, getAddress } from 'viem';
import { randomBytes } from 'crypto';
import { UserAccount } from './entities/user-account.entity.js';
import { Role, SystemRole } from './entities/role.entity.js';
import { Permission } from './entities/permission.entity.js';
import { UserRoleScope } from './entities/user-role-scope.entity.js';
import { WalletBinding, WalletBindingStatus } from './entities/wallet-binding.entity.js';
import { Employee } from '../employee/employee.entity.js';
const BCRYPT_ROUNDS = 12;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
let AuthService = class AuthService {
    accountRepo;
    roleRepo;
    permissionRepo;
    scopeRepo;
    walletRepo;
    employeeRepo;
    jwtService;
    configService;
    eventEmitter;
    dataSource;
    constructor(accountRepo, roleRepo, permissionRepo, scopeRepo, walletRepo, employeeRepo, jwtService, configService, eventEmitter, dataSource) {
        this.accountRepo = accountRepo;
        this.roleRepo = roleRepo;
        this.permissionRepo = permissionRepo;
        this.scopeRepo = scopeRepo;
        this.walletRepo = walletRepo;
        this.employeeRepo = employeeRepo;
        this.jwtService = jwtService;
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        this.dataSource = dataSource;
    }
    async createAccount(dto, createdBy) {
        const employee = await this.employeeRepo.findOne({ where: { id: dto.employeeId } });
        if (!employee)
            throw new NotFoundException('Employee not found');
        const existing = await this.accountRepo.findOne({ where: { employeeId: dto.employeeId } });
        if (existing)
            throw new ConflictException('An account already exists for this employee');
        const passwordHash = await bcrypt.hash(dto.temporaryPassword, BCRYPT_ROUNDS);
        const account = this.accountRepo.create({
            employeeId: dto.employeeId,
            passwordHash,
            mustChangePassword: true,
            isActive: true,
        });
        const saved = await this.accountRepo.save(account);
        const employeeRole = await this.roleRepo.findOne({ where: { name: SystemRole.EMPLOYEE } });
        if (employeeRole) {
            await this.scopeRepo.save(this.scopeRepo.create({
                userId: saved.id,
                roleId: employeeRole.id,
                orgUnitId: null,
                grantedBy: createdBy,
            }));
        }
        this.eventEmitter.emit('auth.account.created', { accountId: saved.id, createdBy });
        return saved;
    }
    async validateLocalCredentials(email, password) {
        const employee = await this.employeeRepo.findOne({ where: { email } });
        if (!employee)
            return null;
        const account = await this.accountRepo.findOne({ where: { employeeId: employee.id } });
        if (!account || !account.isActive)
            return null;
        if (account.lockedUntil && account.lockedUntil > new Date()) {
            throw new ForbiddenException(`Account locked. Try again after ${account.lockedUntil.toISOString()}`);
        }
        const isMatch = await bcrypt.compare(password, account.passwordHash);
        if (!isMatch) {
            account.failedLoginCount += 1;
            if (account.failedLoginCount >= MAX_FAILED_LOGINS) {
                account.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
                this.eventEmitter.emit('auth.account.locked', { accountId: account.id });
            }
            await this.accountRepo.save(account);
            return null;
        }
        account.failedLoginCount = 0;
        account.lockedUntil = null;
        account.lastLoginAt = new Date();
        await this.accountRepo.save(account);
        return account;
    }
    async login(account) {
        const scopes = await this.scopeRepo.find({
            where: { userId: account.id },
            relations: ['role'],
        });
        const roles = scopes.map((s) => s.role.name);
        const scopeData = scopes.map((s) => ({ roleId: s.roleId, orgUnitId: s.orgUnitId }));
        const employee = await this.employeeRepo.findOne({ where: { id: account.employeeId } });
        const payload = {
            sub: account.id,
            employeeId: account.employeeId,
            email: employee?.email ?? '',
            roles,
            scopes: scopeData,
            mustChangePassword: account.mustChangePassword,
        };
        const expiresIn = this.configService.get('JWT_EXPIRES_IN') ?? '8h';
        const accessToken = this.jwtService.sign(payload, { expiresIn: expiresIn });
        this.eventEmitter.emit('auth.login', { accountId: account.id });
        return { accessToken, expiresIn, mustChangePassword: account.mustChangePassword };
    }
    async changePassword(userId, dto) {
        const account = await this.accountRepo.findOne({ where: { id: userId } });
        if (!account)
            throw new NotFoundException('Account not found');
        const isMatch = await bcrypt.compare(dto.currentPassword, account.passwordHash);
        if (!isMatch)
            throw new UnauthorizedException('Current password is incorrect');
        account.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
        account.mustChangePassword = false;
        await this.accountRepo.save(account);
        this.eventEmitter.emit('auth.password.changed', { accountId: account.id });
        return { message: 'Password changed successfully' };
    }
    async assignRole(dto, grantedBy) {
        const account = await this.accountRepo.findOne({ where: { id: dto.userId } });
        if (!account)
            throw new NotFoundException('UserAccount not found');
        const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
        if (!role)
            throw new NotFoundException('Role not found');
        const existing = await this.scopeRepo.findOne({
            where: {
                userId: dto.userId,
                roleId: dto.roleId,
                orgUnitId: dto.orgUnitId ?? IsNull(),
            },
        });
        if (existing)
            throw new ConflictException('This role scope is already assigned');
        const scope = this.scopeRepo.create({
            userId: dto.userId,
            roleId: dto.roleId,
            orgUnitId: dto.orgUnitId ?? null,
            grantedBy,
        });
        return this.scopeRepo.save(scope);
    }
    async revokeRole(scopeId, revokedBy) {
        const scope = await this.scopeRepo.findOne({ where: { id: scopeId } });
        if (!scope)
            throw new NotFoundException('Role scope not found');
        await this.scopeRepo.remove(scope);
        this.eventEmitter.emit('auth.role.revoked', { scopeId, revokedBy });
    }
    async getUserRoles(userId) {
        return this.scopeRepo.find({
            where: { userId },
            relations: ['role'],
        });
    }
    async getAllRoles() {
        return this.roleRepo.find();
    }
    async requestWalletChallenge(employeeId, walletAddress) {
        let checksummed;
        try {
            checksummed = getAddress(walletAddress);
        }
        catch {
            throw new BadRequestException('Invalid Ethereum address');
        }
        const conflictBinding = await this.walletRepo.findOne({
            where: { walletAddress: checksummed, status: WalletBindingStatus.VERIFIED },
        });
        if (conflictBinding && conflictBinding.employeeId !== employeeId) {
            throw new ConflictException('This wallet address is already bound to another employee');
        }
        await this.walletRepo
            .createQueryBuilder()
            .update(WalletBinding)
            .set({ status: WalletBindingStatus.REVOKED })
            .where('employeeId = :employeeId AND status = :status', {
            employeeId,
            status: WalletBindingStatus.PENDING,
        })
            .execute();
        const challenge = `Sign this message to link your wallet to your organizational account.\n\nNonce: ${randomBytes(16).toString('hex')}\nTimestamp: ${new Date().toISOString()}`;
        const binding = this.walletRepo.create({
            employeeId,
            walletAddress: checksummed,
            status: WalletBindingStatus.PENDING,
            challenge,
            challengeIssuedAt: new Date(),
        });
        await this.walletRepo.save(binding);
        return { challenge, message: 'Sign this message in your wallet to verify ownership' };
    }
    async verifyWalletSignature(employeeId, walletAddress, challenge, signature) {
        let checksummed;
        try {
            checksummed = getAddress(walletAddress);
        }
        catch {
            throw new BadRequestException('Invalid Ethereum address');
        }
        const binding = await this.walletRepo.findOne({
            where: {
                employeeId,
                walletAddress: checksummed,
                status: WalletBindingStatus.PENDING,
            },
        });
        if (!binding)
            throw new NotFoundException('No pending wallet binding found');
        if (!binding.challengeIssuedAt ||
            Date.now() - binding.challengeIssuedAt.getTime() > CHALLENGE_TTL_MS) {
            throw new BadRequestException('Challenge has expired. Please request a new one.');
        }
        if (binding.challenge !== challenge) {
            throw new BadRequestException('Challenge mismatch');
        }
        let isValid = false;
        try {
            isValid = await verifyMessage({
                address: checksummed,
                message: challenge,
                signature: signature,
            });
        }
        catch {
            throw new BadRequestException('Signature verification failed');
        }
        if (!isValid)
            throw new UnauthorizedException('Signature does not match wallet address');
        await this.walletRepo
            .createQueryBuilder()
            .update(WalletBinding)
            .set({ status: WalletBindingStatus.REVOKED })
            .where('employeeId = :employeeId AND status = :status AND id != :id', {
            employeeId,
            status: WalletBindingStatus.VERIFIED,
            id: binding.id,
        })
            .execute();
        binding.status = WalletBindingStatus.VERIFIED;
        binding.verifiedAt = new Date();
        binding.challenge = null;
        const saved = await this.walletRepo.save(binding);
        this.eventEmitter.emit('wallet.binding.verified', {
            employeeId,
            walletAddress: checksummed,
        });
        return saved;
    }
    async getActiveWalletBinding(employeeId) {
        return this.walletRepo.findOne({
            where: { employeeId, status: WalletBindingStatus.VERIFIED },
        });
    }
    async revokeWalletBinding(bindingId, revokedBy) {
        const binding = await this.walletRepo.findOne({ where: { id: bindingId } });
        if (!binding)
            throw new NotFoundException('Wallet binding not found');
        binding.status = WalletBindingStatus.REVOKED;
        await this.walletRepo.save(binding);
        this.eventEmitter.emit('wallet.binding.revoked', { bindingId, revokedBy });
    }
    async getProfile(user) {
        const [account, employee, scopes, walletBinding] = await Promise.all([
            this.accountRepo.findOne({ where: { id: user.userId } }),
            this.employeeRepo.findOne({
                where: { id: user.employeeId },
                relations: ['organizationalUnit', 'position'],
            }),
            this.scopeRepo.find({ where: { userId: user.userId }, relations: ['role'] }),
            this.getActiveWalletBinding(user.employeeId),
        ]);
        return {
            account: {
                id: account?.id,
                mustChangePassword: account?.mustChangePassword,
                lastLoginAt: account?.lastLoginAt,
                isActive: account?.isActive,
            },
            employee,
            roles: scopes.map((s) => ({ role: s.role.name, orgUnitId: s.orgUnitId })),
            walletBinding: walletBinding
                ? { address: walletBinding.walletAddress, verifiedAt: walletBinding.verifiedAt }
                : null,
        };
    }
};
AuthService = __decorate([
    Injectable(),
    __param(0, InjectRepository(UserAccount)),
    __param(1, InjectRepository(Role)),
    __param(2, InjectRepository(Permission)),
    __param(3, InjectRepository(UserRoleScope)),
    __param(4, InjectRepository(WalletBinding)),
    __param(5, InjectRepository(Employee)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        JwtService,
        ConfigService,
        EventEmitter2,
        DataSource])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map