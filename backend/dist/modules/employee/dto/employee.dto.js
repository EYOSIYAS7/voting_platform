var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsNotEmpty, IsEmail, IsEnum, IsUUID, IsDateString, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus } from '../employee.entity.js';
export class CreateEmployeeDto {
    employeeId;
    firstName;
    lastName;
    email;
    phone;
    organizationalUnitId;
    positionId;
    status;
    hiredAt;
    profileImageUrl;
}
__decorate([
    ApiProperty({ example: 'EMP-001' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "employeeId", void 0);
__decorate([
    ApiProperty(),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "firstName", void 0);
__decorate([
    ApiProperty(),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "lastName", void 0);
__decorate([
    ApiProperty(),
    IsEmail(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "email", void 0);
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "phone", void 0);
__decorate([
    ApiProperty({ description: 'UUID of the organizational unit this employee belongs to' }),
    IsUUID(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "organizationalUnitId", void 0);
__decorate([
    ApiPropertyOptional({ description: 'UUID of the employee position' }),
    IsUUID(),
    IsOptional(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "positionId", void 0);
__decorate([
    ApiPropertyOptional({ enum: EmployeeStatus, default: EmployeeStatus.PENDING }),
    IsEnum(EmployeeStatus),
    IsOptional(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional(),
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "hiredAt", void 0);
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "profileImageUrl", void 0);
export class UpdateEmployeeDto {
    firstName;
    lastName;
    email;
    phone;
    organizationalUnitId;
    positionId;
    status;
    hiredAt;
    profileImageUrl;
}
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "firstName", void 0);
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "lastName", void 0);
__decorate([
    ApiPropertyOptional(),
    IsEmail(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "email", void 0);
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "phone", void 0);
__decorate([
    ApiPropertyOptional(),
    IsUUID(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "organizationalUnitId", void 0);
__decorate([
    ApiPropertyOptional(),
    IsUUID(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "positionId", void 0);
__decorate([
    ApiPropertyOptional({ enum: EmployeeStatus }),
    IsEnum(EmployeeStatus),
    IsOptional(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional(),
    IsDateString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "hiredAt", void 0);
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "profileImageUrl", void 0);
//# sourceMappingURL=employee.dto.js.map