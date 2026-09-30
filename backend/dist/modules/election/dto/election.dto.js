var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDateString, IsUUID, IsInt, Min, IsBoolean, IsArray, ArrayUnique, MaxLength, MinLength, } from 'class-validator';
import { ElectionType, ElectionStatus } from '../entities/election.entity.js';
export class CreateElectionDto {
    title;
    description;
    organizationId;
    electionType;
    unitScopeId;
    registrationDeadline;
    startDate;
    endDate;
    maxCandidates;
}
__decorate([
    ApiProperty({ example: 'Annual Board of Directors Election 2025' }),
    IsString(),
    MinLength(4),
    MaxLength(200),
    __metadata("design:type", String)
], CreateElectionDto.prototype, "title", void 0);
__decorate([
    ApiPropertyOptional({ example: 'Election of the board for FY2025' }),
    IsOptional(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], CreateElectionDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ example: 'ccc69c16-5177-4d0a-89ee-042f08402abe' }),
    IsUUID(),
    __metadata("design:type", String)
], CreateElectionDto.prototype, "organizationId", void 0);
__decorate([
    ApiPropertyOptional({ enum: ElectionType, default: ElectionType.GENERAL }),
    IsOptional(),
    IsEnum(ElectionType),
    __metadata("design:type", String)
], CreateElectionDto.prototype, "electionType", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Root unit ID for UNIT_SCOPED elections',
        example: 'db155f70-d35d-4ae6-b918-d86ff349c378',
    }),
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateElectionDto.prototype, "unitScopeId", void 0);
__decorate([
    ApiPropertyOptional({ example: '2025-11-01T08:00:00.000Z' }),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateElectionDto.prototype, "registrationDeadline", void 0);
__decorate([
    ApiProperty({ example: '2025-12-01T08:00:00.000Z' }),
    IsDateString(),
    __metadata("design:type", String)
], CreateElectionDto.prototype, "startDate", void 0);
__decorate([
    ApiProperty({ example: '2025-12-07T17:00:00.000Z' }),
    IsDateString(),
    __metadata("design:type", String)
], CreateElectionDto.prototype, "endDate", void 0);
__decorate([
    ApiPropertyOptional({ default: 0, description: '0 = unlimited candidates' }),
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateElectionDto.prototype, "maxCandidates", void 0);
export class UpdateElectionDto extends PartialType(CreateElectionDto) {
}
export class PatchElectionStatusDto {
    status;
}
__decorate([
    ApiProperty({ enum: ElectionStatus }),
    IsEnum(ElectionStatus),
    __metadata("design:type", String)
], PatchElectionStatusDto.prototype, "status", void 0);
export class CreateEligibilityRuleDto {
    unitId;
    includeDescendants;
    allowedPositionIds;
    minTenureMonths;
    requiredStatus;
    description;
}
__decorate([
    ApiPropertyOptional({ description: 'Unit ID to scope eligibility. Null = no unit restriction.' }),
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateEligibilityRuleDto.prototype, "unitId", void 0);
__decorate([
    ApiPropertyOptional({ default: true, description: 'Include all recursive descendant units' }),
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateEligibilityRuleDto.prototype, "includeDescendants", void 0);
__decorate([
    ApiPropertyOptional({
        type: [String],
        description: 'Array of Position UUIDs allowed. Null = no position restriction.',
    }),
    IsOptional(),
    IsArray(),
    ArrayUnique(),
    IsUUID('all', { each: true }),
    __metadata("design:type", Array)
], CreateEligibilityRuleDto.prototype, "allowedPositionIds", void 0);
__decorate([
    ApiPropertyOptional({ default: 0, description: 'Minimum tenure in full months' }),
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateEligibilityRuleDto.prototype, "minTenureMonths", void 0);
__decorate([
    ApiPropertyOptional({ default: 'ACTIVE', description: 'ACTIVE | INACTIVE | ANY' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateEligibilityRuleDto.prototype, "requiredStatus", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateEligibilityRuleDto.prototype, "description", void 0);
//# sourceMappingURL=election.dto.js.map