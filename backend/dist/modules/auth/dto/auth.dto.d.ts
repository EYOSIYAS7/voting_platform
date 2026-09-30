export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class CreateAccountDto {
    employeeId: string;
    temporaryPassword: string;
}
export declare class AssignRoleDto {
    userId: string;
    roleId: string;
    orgUnitId?: string;
}
export declare class TokenResponseDto {
    accessToken: string;
    expiresIn: string;
    mustChangePassword: boolean;
}
