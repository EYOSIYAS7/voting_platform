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

import { UserAccount } from './entities/user-account.entity.js';
import { Role, SystemRole } from './entities/role.entity.js';
import { Permission } from './entities/permission.entity.js';
import { UserRoleScope } from './entities/user-role-scope.entity.js';
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
  // Profile / Me

  // ══════════════════════════════════════════════════════════════════════════

  async getProfile(user: AuthenticatedUser): Promise<object> {
    const [account, employee, scopes] = await Promise.all([
      this.accountRepo.findOne({ where: { id: user.userId } }),
      this.employeeRepo.findOne({
        where: { id: user.employeeId },
        relations: ['organizationalUnit', 'position'],
      }),
      this.scopeRepo.find({ where: { userId: user.userId }, relations: ['role'] }),
    ]);

    return {
      account: {
        id:                 account?.id,
        mustChangePassword: account?.mustChangePassword,
        lastLoginAt:        account?.lastLoginAt,
        isActive:           account?.isActive,
      },
      employee,
      roles: scopes.map((s) => ({ role: s.role.name, orgUnitId: s.orgUnitId })),
    };
  }
}
