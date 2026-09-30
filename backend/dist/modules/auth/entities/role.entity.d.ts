export declare enum SystemRole {
    SYSTEM_ADMIN = "SYSTEM_ADMIN",
    ELECTION_ADMIN = "ELECTION_ADMIN",
    EMPLOYEE = "EMPLOYEE",
    AUDITOR = "AUDITOR"
}
export declare class Role {
    id: string;
    name: SystemRole;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}
