var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsNotEmpty, IsEnum, IsUUID, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitType } from '../organizational-unit.entity.js';
export class CreateOrganizationalUnitDto {
    organizationId;
    parentId;
    name;
    description;
    unitType;
    headEmployeeId;
}
__decorate([
    ApiProperty(),
    IsUUID(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateOrganizationalUnitDto.prototype, "organizationId", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Parent unit ID — omit for top-level units' }),
    IsUUID(),
    IsOptional(),
    __metadata("design:type", String)
], CreateOrganizationalUnitDto.prototype, "parentId", void 0);
__decorate([
    ApiProperty({ example: 'IT Directorate' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateOrganizationalUnitDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateOrganizationalUnitDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ enum: UnitType }),
    IsEnum(UnitType),
    __metadata("design:type", String)
], CreateOrganizationalUnitDto.prototype, "unitType", void 0);
__decorate([
    ApiPropertyOptional({ description: 'UUID of the employee who heads this unit' }),
    IsUUID(),
    IsOptional(),
    __metadata("design:type", String)
], CreateOrganizationalUnitDto.prototype, "headEmployeeId", void 0);
export class UpdateOrganizationalUnitDto {
    name;
    description;
    unitType;
    parentId;
    headEmployeeId;
    status;
}
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateOrganizationalUnitDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateOrganizationalUnitDto.prototype, "description", void 0);
__decorate([
    ApiPropertyOptional({ enum: UnitType }),
    IsEnum(UnitType),
    IsOptional(),
    __metadata("design:type", String)
], UpdateOrganizationalUnitDto.prototype, "unitType", void 0);
__decorate([
    ApiPropertyOptional(),
    IsUUID(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateOrganizationalUnitDto.prototype, "parentId", void 0);
__decorate([
    ApiPropertyOptional(),
    IsUUID(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateOrganizationalUnitDto.prototype, "headEmployeeId", void 0);
__decorate([
    ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateOrganizationalUnitDto.prototype, "status", void 0);
//# sourceMappingURL=organizational-unit.dto.js.map