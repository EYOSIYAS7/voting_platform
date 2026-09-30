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
export var WalletBindingStatus;
(function (WalletBindingStatus) {
    WalletBindingStatus["PENDING"] = "PENDING";
    WalletBindingStatus["VERIFIED"] = "VERIFIED";
    WalletBindingStatus["REVOKED"] = "REVOKED";
})(WalletBindingStatus || (WalletBindingStatus = {}));
let WalletBinding = class WalletBinding {
    id;
    employeeId;
    employee;
    walletAddress;
    status;
    challenge;
    challengeIssuedAt;
    verifiedAt;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], WalletBinding.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar' }),
    __metadata("design:type", String)
], WalletBinding.prototype, "employeeId", void 0);
__decorate([
    ManyToOne(() => Employee, { onDelete: 'CASCADE', eager: false }),
    JoinColumn({ name: 'employeeId' }),
    __metadata("design:type", Employee)
], WalletBinding.prototype, "employee", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], WalletBinding.prototype, "walletAddress", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: WalletBindingStatus,
        default: WalletBindingStatus.PENDING,
    }),
    __metadata("design:type", String)
], WalletBinding.prototype, "status", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], WalletBinding.prototype, "challenge", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], WalletBinding.prototype, "challengeIssuedAt", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], WalletBinding.prototype, "verifiedAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], WalletBinding.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], WalletBinding.prototype, "updatedAt", void 0);
WalletBinding = __decorate([
    Entity('wallet_bindings'),
    Index(['walletAddress'], { unique: false })
], WalletBinding);
export { WalletBinding };
//# sourceMappingURL=wallet-binding.entity.js.map