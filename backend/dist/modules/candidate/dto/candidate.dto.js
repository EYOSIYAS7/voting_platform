var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, MaxLength, MinLength, IsUrl, } from 'class-validator';
import { CandidateStatus } from '../entities/candidate.entity.js';
export class NominateCandidateDto {
    employeeId;
    statement;
    slogan;
    photoUrl;
}
__decorate([
    ApiProperty({
        description: 'Employee UUID to nominate as a candidate',
        example: '8188f870-251d-47d6-9ce7-9a168eb1d01f',
    }),
    IsUUID(),
    __metadata("design:type", String)
], NominateCandidateDto.prototype, "employeeId", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Campaign statement / bio (max 2000 chars)',
        example: 'I will champion transparency and accountability...',
    }),
    IsOptional(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], NominateCandidateDto.prototype, "statement", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Short campaign slogan (max 200 chars)',
        example: 'Security First, Always.',
    }),
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], NominateCandidateDto.prototype, "slogan", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'URL to a candidate campaign photo',
        example: 'https://cdn.insa.gov.et/candidates/photo.jpg',
    }),
    IsOptional(),
    IsUrl(),
    __metadata("design:type", String)
], NominateCandidateDto.prototype, "photoUrl", void 0);
export class SelfNominateDto {
    statement;
    slogan;
    photoUrl;
}
__decorate([
    ApiPropertyOptional({
        description: 'Campaign statement / bio (max 2000 chars)',
    }),
    IsOptional(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], SelfNominateDto.prototype, "statement", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Short campaign slogan (max 200 chars)',
    }),
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], SelfNominateDto.prototype, "slogan", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'URL to a candidate campaign photo',
    }),
    IsOptional(),
    IsUrl(),
    __metadata("design:type", String)
], SelfNominateDto.prototype, "photoUrl", void 0);
export class UpdateCandidateDto {
    statement;
    slogan;
    photoUrl;
}
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], UpdateCandidateDto.prototype, "statement", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdateCandidateDto.prototype, "slogan", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsUrl(),
    __metadata("design:type", String)
], UpdateCandidateDto.prototype, "photoUrl", void 0);
export class ReviewCandidateDto {
    status;
    rejectionReason;
}
__decorate([
    ApiProperty({
        enum: [CandidateStatus.APPROVED, CandidateStatus.REJECTED],
        description: 'Admin decision — APPROVED or REJECTED',
    }),
    IsEnum([CandidateStatus.APPROVED, CandidateStatus.REJECTED]),
    __metadata("design:type", String)
], ReviewCandidateDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Required when status is REJECTED. Reason for rejection.',
        example: 'Candidate does not meet minimum tenure requirement.',
    }),
    IsOptional(),
    IsString(),
    MinLength(5),
    MaxLength(1000),
    __metadata("design:type", String)
], ReviewCandidateDto.prototype, "rejectionReason", void 0);
//# sourceMappingURL=candidate.dto.js.map