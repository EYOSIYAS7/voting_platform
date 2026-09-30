import { AuthService } from './auth.service.js';
import { UserAccount } from './entities/user-account.entity.js';
import type { AuthenticatedUser } from '../../common/types/jwt-payload.types.js';
import { LoginDto, ChangePasswordDto, CreateAccountDto, AssignRoleDto, TokenResponseDto } from './dto/auth.dto.js';
import { WalletChallengeDto, WalletVerifyDto } from './dto/wallet.dto.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(_dto: LoginDto, account: UserAccount): Promise<TokenResponseDto>;
    getMe(user: AuthenticatedUser): Promise<object>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    requestChallenge(employeeId: string, dto: WalletChallengeDto): Promise<{
        challenge: string;
        message: string;
    }>;
    verifyWallet(employeeId: string, dto: WalletVerifyDto): Promise<import("./entities/wallet-binding.entity.js").WalletBinding>;
    getWallet(employeeId: string): Promise<import("./entities/wallet-binding.entity.js").WalletBinding | null>;
    revokeWallet(bindingId: string, userId: string): Promise<void>;
    createAccount(dto: CreateAccountDto, adminId: string): Promise<UserAccount>;
    assignRole(dto: AssignRoleDto, adminId: string): Promise<import("./entities/user-role-scope.entity.js").UserRoleScope>;
    revokeRole(scopeId: string, adminId: string): Promise<void>;
    getRoles(): Promise<import("./entities/role.entity.js").Role[]>;
    getUserRoles(userId: string): Promise<import("./entities/user-role-scope.entity.js").UserRoleScope[]>;
}
