var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
import { Organization } from '../organization/organization.entity.js';
export var UnitType;
(function (UnitType) {
    UnitType["ORGANIZATION"] = "ORGANIZATION";
    UnitType["DEPUTY_DIRECTORATE"] = "DEPUTY_DIRECTORATE";
    UnitType["DIRECTORATE"] = "DIRECTORATE";
    UnitType["DIVISION"] = "DIVISION";
    UnitType["DEPARTMENT"] = "DEPARTMENT";
    UnitType["TEAM"] = "TEAM";
    UnitType["OTHER"] = "OTHER";
})(UnitType || (UnitType = {}));
let OrganizationalUnit = class OrganizationalUnit {
    id;
    organizationId;
    organization;
    parentId;
    parent;
    children;
    name;
    description;
    unitType;
    headEmployeeId;
    status;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], OrganizationalUnit.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], OrganizationalUnit.prototype, "organizationId", void 0);
__decorate([
    ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: false }),
    JoinColumn({ name: 'organizationId' }),
    __metadata("design:type", Organization)
], OrganizationalUnit.prototype, "organization", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], OrganizationalUnit.prototype, "parentId", void 0);
__decorate([
    ManyToOne(() => OrganizationalUnit, (unit) => unit.children, { nullable: true, onDelete: 'SET NULL' }),
    JoinColumn({ name: 'parentId' }),
    __metadata("design:type", Object)
], OrganizationalUnit.prototype, "parent", void 0);
__decorate([
    OneToMany(() => OrganizationalUnit, (unit) => unit.parent),
    __metadata("design:type", Array)
], OrganizationalUnit.prototype, "children", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], OrganizationalUnit.prototype, "name", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], OrganizationalUnit.prototype, "description", void 0);
__decorate([
    Column({ type: 'enum', enum: UnitType, default: UnitType.OTHER }),
    __metadata("design:type", String)
], OrganizationalUnit.prototype, "unitType", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], OrganizationalUnit.prototype, "headEmployeeId", void 0);
__decorate([
    Column({ default: 'ACTIVE' }),
    __metadata("design:type", String)
], OrganizationalUnit.prototype, "status", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], OrganizationalUnit.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], OrganizationalUnit.prototype, "updatedAt", void 0);
OrganizationalUnit = __decorate([
    Entity('organizational_units')
], OrganizationalUnit);
export { OrganizationalUnit };
//# sourceMappingURL=organizational-unit.entity.js.map