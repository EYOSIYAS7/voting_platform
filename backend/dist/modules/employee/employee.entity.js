var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
import { OrganizationalUnit } from '../organizational-unit/organizational-unit.entity.js';
import { Position } from '../position/position.entity.js';
export var EmployeeStatus;
(function (EmployeeStatus) {
    EmployeeStatus["ACTIVE"] = "ACTIVE";
    EmployeeStatus["INACTIVE"] = "INACTIVE";
    EmployeeStatus["PENDING"] = "PENDING";
    EmployeeStatus["TERMINATED"] = "TERMINATED";
})(EmployeeStatus || (EmployeeStatus = {}));
let Employee = class Employee {
    id;
    employeeId;
    firstName;
    lastName;
    email;
    phone;
    organizationalUnitId;
    organizationalUnit;
    positionId;
    position;
    status;
    profileImageUrl;
    hiredAt;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Employee.prototype, "id", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], Employee.prototype, "employeeId", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Employee.prototype, "firstName", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Employee.prototype, "lastName", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], Employee.prototype, "email", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Employee.prototype, "phone", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Employee.prototype, "organizationalUnitId", void 0);
__decorate([
    ManyToOne(() => OrganizationalUnit, { onDelete: 'RESTRICT', eager: false }),
    JoinColumn({ name: 'organizationalUnitId' }),
    __metadata("design:type", OrganizationalUnit)
], Employee.prototype, "organizationalUnit", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Employee.prototype, "positionId", void 0);
__decorate([
    ManyToOne(() => Position, { nullable: true, onDelete: 'SET NULL', eager: false }),
    JoinColumn({ name: 'positionId' }),
    __metadata("design:type", Position)
], Employee.prototype, "position", void 0);
__decorate([
    Column({ type: 'enum', enum: EmployeeStatus, default: EmployeeStatus.PENDING }),
    __metadata("design:type", String)
], Employee.prototype, "status", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Employee.prototype, "profileImageUrl", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], Employee.prototype, "hiredAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Employee.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Employee.prototype, "updatedAt", void 0);
Employee = __decorate([
    Entity('employees')
], Employee);
export { Employee };
//# sourceMappingURL=employee.entity.js.map