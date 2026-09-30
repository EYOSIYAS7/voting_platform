import { Employee } from '../../employee/employee.entity.js';
export declare enum WalletBindingStatus {
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    REVOKED = "REVOKED"
}
export declare class WalletBinding {
    id: string;
    employeeId: string;
    employee: Employee;
    walletAddress: string;
    status: WalletBindingStatus;
    challenge: string | null;
    challengeIssuedAt: Date | null;
    verifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
