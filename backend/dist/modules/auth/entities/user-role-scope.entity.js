var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index, } from 'typeorm';
import { UserAccount } from './user-account.entity.js';
import { Role } from './role.entity.js';
let UserRoleScope = class UserRoleScope {
    id;
    userId;
    user;
    roleId;
    role;
    orgUnitId;
    grantedBy;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], UserRoleScope.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar' }),
    __metadata("design:type", String)
], UserRoleScope.prototype, "userId", void 0);
__decorate([
    ManyToOne(() => UserAccount, { onDelete: 'CASCADE', eager: false }),
    JoinColumn({ name: 'userId' }),
    __metadata("design:type", UserAccount)
], UserRoleScope.prototype, "user", void 0);
__decorate([
    Column({ type: 'varchar' }),
    __metadata("design:type", String)
], UserRoleScope.prototype, "roleId", void 0);
__decorate([
    ManyToOne(() => Role, { onDelete: 'CASCADE', eager: false }),
    JoinColumn({ name: 'roleId' }),
    __metadata("design:type", Role)
], UserRoleScope.prototype, "role", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], UserRoleScope.prototype, "orgUnitId", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], UserRoleScope.prototype, "grantedBy", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], UserRoleScope.prototype, "createdAt", void 0);
UserRoleScope = __decorate([
    Entity('user_role_scopes'),
    Index(['userId', 'roleId', 'orgUnitId'], { unique: true })
], UserRoleScope);
export { UserRoleScope };
//# sourceMappingURL=user-role-scope.entity.js.map