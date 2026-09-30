import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserAccount } from './entities/user-account.entity.js';
import { Role } from './entities/role.entity.js';
import { Permission } from './entities/permission.entity.js';
import { UserRoleScope } from './entities/user-role-scope.entity.js';
import { WalletBinding } from './entities/wallet-binding.entity.js';
import { Employee } from '../employee/employee.entity.js';
import { AuthenticatedUser } from '../../common/types/jwt-payload.types.js';
import { CreateAccountDto, AssignRoleDto, ChangePasswordDto, TokenResponseDto } from './dto/auth.dto.js';
export declare class AuthService {
    private readonly accountRepo;
    private readonly roleRepo;
    private readonly permissionRepo;
    private readonly scopeRepo;
    private readonly walletRepo;
    private readonly employeeRepo;
    private readonly jwtService;
    private readonly configService;
    private readonly eventEmitter;
    private readonly dataSource;
    constructor(accountRepo: Repository<UserAccount>, roleRepo: Repository<Role>, permissionRepo: Repository<Permission>, scopeRepo: Repository<UserRoleScope>, walletRepo: Repository<WalletBinding>, employeeRepo: Repository<Employee>, jwtService: JwtService, configService: ConfigService, eventEmitter: EventEmitter2, dataSource: DataSource);
    createAccount(dto: CreateAccountDto, createdBy: string): Promise<UserAccount>;
    validateLocalCredentials(email: string, password: string): Promise<UserAccount | null>;
    login(account: UserAccount): Promise<TokenResponseDto>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    assignRole(dto: AssignRoleDto, grantedBy: string): Promise<UserRoleScope>;
    revokeRole(scopeId: string, revokedBy: string): Promise<void>;
    getUserRoles(userId: string): Promise<UserRoleScope[]>;
    getAllRoles(): Promise<Role[]>;
    requestWalletChallenge(employeeId: string, walletAddress: string): Promise<{
        challenge: string;
        message: string;
    }>;
    verifyWalletSignature(employeeId: string, walletAddress: string, challenge: string, signature: string): Promise<WalletBinding>;
    getActiveWalletBinding(employeeId: string): Promise<WalletBinding | null>;
    revokeWalletBinding(bindingId: string, revokedBy: string): Promise<void>;
    getProfile(user: AuthenticatedUser): Promise<object>;
}
