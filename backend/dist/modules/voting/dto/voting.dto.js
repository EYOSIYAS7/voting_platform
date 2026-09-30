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
import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
export class CastVoteDto {
    candidateId;
    note;
}
__decorate([
    ApiProperty({
        description: 'The candidate UUID (from our DB) the employee is voting for',
        example: 'a1b2c3d4-...',
    }),
    IsUUID(),
    __metadata("design:type", String)
], CastVoteDto.prototype, "candidateId", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Optional anonymous note / reason (not stored on-chain)',
        maxLength: 500,
    }),
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CastVoteDto.prototype, "note", void 0);
export class PublishElectionDto {
    imageUrl;
}
__decorate([
    ApiPropertyOptional({
        description: 'Optional cover image URL to store on-chain',
        example: 'https://cdn.insa.gov.et/elections/cover.jpg',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PublishElectionDto.prototype, "imageUrl", void 0);
//# sourceMappingURL=voting.dto.js.map