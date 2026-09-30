var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, } from 'typeorm';
import { Employee } from '../../employee/employee.entity.js';
let UserAccount = class UserAccount {
    id;
    employeeId;
    employee;
    passwordHash;
    mustChangePassword;
    isActive;
    failedLoginCount;
    lockedUntil;
    lastLoginAt;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], UserAccount.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar' }),
    __metadata("design:type", String)
], UserAccount.prototype, "employeeId", void 0);
__decorate([
    ManyToOne(() => Employee, { onDelete: 'CASCADE', eager: false }),
    JoinColumn({ name: 'employeeId' }),
    __metadata("design:type", Employee)
], UserAccount.prototype, "employee", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], UserAccount.prototype, "passwordHash", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], UserAccount.prototype, "mustChangePassword", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], UserAccount.prototype, "isActive", void 0);
__decorate([
    Column({ default: 0 }),
    __metadata("design:type", Number)
], UserAccount.prototype, "failedLoginCount", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], UserAccount.prototype, "lockedUntil", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], UserAccount.prototype, "lastLoginAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], UserAccount.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], UserAccount.prototype, "updatedAt", void 0);
UserAccount = __decorate([
    Entity('user_accounts'),
    Index(['employeeId'], { unique: true })
], UserAccount);
export { UserAccount };
//# sourceMappingURL=user-account.entity.js.map