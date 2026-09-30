import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { JwtPayload, AuthenticatedUser } from '../../common/types/jwt-payload.types.js';
import {
  CreateAccountDto,
  AssignRoleDto,
  ChangePasswordDto,
  TokenResponseDto,
} from './dto/auth.dto.js';

const BCRYPT_ROUNDS    = 12;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES   = 15;
const CHALLENGE_TTL_MS  = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly accountRepo: Repository<UserAccount>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,

    @InjectRepository(UserRoleScope)
    private readonly scopeRepo: Repository<UserRoleScope>,

    @InjectRepository(WalletBinding)
    private readonly walletRepo: Repository<WalletBinding>,

    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // Account Management
  // ══════════════════════════════════════════════════════════════════════════

  async createAccount(dto: CreateAccountDto, createdBy: string): Promise<UserAccount> {
    const employee = await this.employeeRepo.findOne({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const existing = await this.accountRepo.findOne({ where: { employeeId: dto.employeeId } });
    if (existing) throw new ConflictException('An account already exists for this employee');

    const passwordHash = await bcrypt.hash(dto.temporaryPassword, BCRYPT_ROUNDS);

    const account = this.accountRepo.create({
      employeeId:         dto.employeeId,
      passwordHash,
      mustChangePassword: true,
      isActive:           true,
    });
    const saved = await this.accountRepo.save(account);

    // Auto-assign EMPLOYEE role
    const employeeRole = await this.roleRepo.findOne({ where: { name: SystemRole.EMPLOYEE } });
    if (employeeRole) {
      await this.scopeRepo.save(
        this.scopeRepo.create({
          userId:    saved.id,
          roleId:    employeeRole.id,
          orgUnitId: null,
          grantedBy: createdBy,
        }),
      );
    }

    this.eventEmitter.emit('auth.account.created', { accountId: saved.id, createdBy });
    return saved;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Local Authentication (email + password)
  // ══════════════════════════════════════════════════════════════════════════

  async validateLocalCredentials(email: string, password: string): Promise<UserAccount | null> {
    const employee = await this.employeeRepo.findOne({ where: { email } });
    if (!employee) return null;

    const account = await this.accountRepo.findOne({ where: { employeeId: employee.id } });
    if (!account || !account.isActive) return null;

    // Check account lockout
    if (account.lockedUntil && account.lockedUntil > new Date()) {
      throw new ForbiddenException(
        `Account locked. Try again after ${account.lockedUntil.toISOString()}`,
      );
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

    // Reset on success
    account.failedLoginCount = 0;
    account.lockedUntil      = null;
    account.lastLoginAt      = new Date();
    await this.accountRepo.save(account);

    return account;
  }

  async login(account: UserAccount): Promise<TokenResponseDto> {
    const scopes = await this.scopeRepo.find({
      where: { userId: account.id },
      relations: ['role'],
    });

    const roles     = scopes.map((s) => s.role.name as SystemRole);
    const scopeData = scopes.map((s) => ({ roleId: s.roleId, orgUnitId: s.orgUnitId }));

    // Fetch employee email for the payload
    const employee = await this.employeeRepo.findOne({ where: { id: account.employeeId } });

    const payload: JwtPayload = {
      sub:               account.id,
      employeeId:        account.employeeId,
      email:             employee?.email ?? '',
      roles,
      scopes:            scopeData,
      mustChangePassword: account.mustChangePassword,
    };

    const expiresIn    = this.configService.get<string>('JWT_EXPIRES_IN') ?? '8h';
    const accessToken  = this.jwtService.sign(payload, { expiresIn: expiresIn as any });

    this.eventEmitter.emit('auth.login', { accountId: account.id });

    return { accessToken, expiresIn, mustChangePassword: account.mustChangePassword };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const account = await this.accountRepo.findOne({ where: { id: userId } });
    if (!account) throw new NotFoundException('Account not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, account.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    account.passwordHash       = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    account.mustChangePassword = false;
    await this.accountRepo.save(account);

    this.eventEmitter.emit('auth.password.changed', { accountId: account.id });
    return { message: 'Password changed successfully' };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Role Management
  // ══════════════════════════════════════════════════════════════════════════

  async assignRole(dto: AssignRoleDto, grantedBy: string): Promise<UserRoleScope> {
    const account = await this.accountRepo.findOne({ where: { id: dto.userId } });
    if (!account) throw new NotFoundException('UserAccount not found');

    const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const existing = await this.scopeRepo.findOne({
      where: {
        userId:    dto.userId,
        roleId:    dto.roleId,
        orgUnitId: dto.orgUnitId ?? IsNull(),
      },
    });
    if (existing) throw new ConflictException('This role scope is already assigned');

    const scope = this.scopeRepo.create({
      userId:    dto.userId,
      roleId:    dto.roleId,
      orgUnitId: dto.orgUnitId ?? null,
      grantedBy,
    });
    return this.scopeRepo.save(scope);
  }

  async revokeRole(scopeId: string, revokedBy: string): Promise<void> {
    const scope = await this.scopeRepo.findOne({ where: { id: scopeId } });
    if (!scope) throw new NotFoundException('Role scope not found');
    await this.scopeRepo.remove(scope);
    this.eventEmitter.emit('auth.role.revoked', { scopeId, revokedBy });
  }

  async getUserRoles(userId: string): Promise<UserRoleScope[]> {
    return this.scopeRepo.find({
      where: { userId },
      relations: ['role'],
    });
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepo.find();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Wallet Binding (SIWE)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Step 1: Issue a challenge nonce for the wallet address.
   * The frontend will present this to MetaMask/RainbowKit for signing.
   */
  async requestWalletChallenge(
    employeeId: string,
    walletAddress: string,
  ): Promise<{ challenge: string; message: string }> {
    // Normalise to EIP-55 checksummed address
    let checksummed: string;
    try {
      checksummed = getAddress(walletAddress);
    } catch {
      throw new BadRequestException('Invalid Ethereum address');
    }

    // Check address isn't already verified by another employee
    const conflictBinding = await this.walletRepo.findOne({
      where: { walletAddress: checksummed, status: WalletBindingStatus.VERIFIED },
    });
    if (conflictBinding && conflictBinding.employeeId !== employeeId) {
      throw new ConflictException('This wallet address is already bound to another employee');
    }

    // Expire any old PENDING bindings for this employee+address
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
      status:             WalletBindingStatus.PENDING,
      challenge,
      challengeIssuedAt:  new Date(),
    });
    await this.walletRepo.save(binding);

    return { challenge, message: 'Sign this message in your wallet to verify ownership' };
  }

  /**
   * Step 2: Verify the signed challenge. On success, mark binding as VERIFIED.
   */
  async verifyWalletSignature(
    employeeId: string,
    walletAddress: string,
    challenge: string,
    signature: string,
  ): Promise<WalletBinding> {
    let checksummed: string;
    try {
      checksummed = getAddress(walletAddress);
    } catch {
      throw new BadRequestException('Invalid Ethereum address');
    }

    const binding = await this.walletRepo.findOne({
      where: {
        employeeId,
        walletAddress: checksummed,
        status:        WalletBindingStatus.PENDING,
      },
    });
    if (!binding) throw new NotFoundException('No pending wallet binding found');

    // Check challenge TTL
    if (
      !binding.challengeIssuedAt ||
      Date.now() - binding.challengeIssuedAt.getTime() > CHALLENGE_TTL_MS
    ) {
      throw new BadRequestException('Challenge has expired. Please request a new one.');
    }

    // Verify the stored challenge matches what was sent
    if (binding.challenge !== challenge) {
      throw new BadRequestException('Challenge mismatch');
    }

    // Verify ECDSA signature using viem
    let isValid = false;
    try {
      isValid = await verifyMessage({
        address:   checksummed as `0x${string}`,
        message:   challenge,
        signature: signature as `0x${string}`,
      });
    } catch {
      throw new BadRequestException('Signature verification failed');
    }

    if (!isValid) throw new UnauthorizedException('Signature does not match wallet address');

    // Revoke any previously verified binding for this employee (replace it)
    await this.walletRepo
      .createQueryBuilder()
      .update(WalletBinding)
      .set({ status: WalletBindingStatus.REVOKED })
      .where('employeeId = :employeeId AND status = :status AND id != :id', {
        employeeId,
        status: WalletBindingStatus.VERIFIED,
        id:     binding.id,
      })
      .execute();

    binding.status     = WalletBindingStatus.VERIFIED;
    binding.verifiedAt = new Date();
    binding.challenge  = null;
    const saved = await this.walletRepo.save(binding);

    this.eventEmitter.emit('wallet.binding.verified', {
      employeeId,
      walletAddress: checksummed,
    });

    return saved;
  }

  async getActiveWalletBinding(employeeId: string): Promise<WalletBinding | null> {
    return this.walletRepo.findOne({
      where: { employeeId, status: WalletBindingStatus.VERIFIED },
    });
  }

  async revokeWalletBinding(bindingId: string, revokedBy: string): Promise<void> {
    const binding = await this.walletRepo.findOne({ where: { id: bindingId } });
    if (!binding) throw new NotFoundException('Wallet binding not found');
    binding.status = WalletBindingStatus.REVOKED;
    await this.walletRepo.save(binding);
    this.eventEmitter.emit('wallet.binding.revoked', { bindingId, revokedBy });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Profile / Me
  // ══════════════════════════════════════════════════════════════════════════

  async getProfile(user: AuthenticatedUser): Promise<object> {
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
        id:                 account?.id,
        mustChangePassword: account?.mustChangePassword,
        lastLoginAt:        account?.lastLoginAt,
        isActive:           account?.isActive,
      },
      employee,
      roles:         scopes.map((s) => ({ role: s.role.name, orgUnitId: s.orgUnitId })),
      walletBinding: walletBinding
        ? { address: walletBinding.walletAddress, verifiedAt: walletBinding.verifiedAt }
        : null,
    };
  }
}
