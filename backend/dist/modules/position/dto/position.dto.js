var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export class CreatePositionDto {
    name;
    description;
    level;
}
__decorate([
    ApiProperty({ example: 'Division Head' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreatePositionDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreatePositionDto.prototype, "description", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Org chart level — lower = higher rank (1 = top)', example: 3 }),
    IsNumber(),
    IsOptional(),
    Type(() => Number),
    __metadata("design:type", Number)
], CreatePositionDto.prototype, "level", void 0);
export class UpdatePositionDto {
    name;
    description;
    level;
    isActive;
}
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdatePositionDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional(),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdatePositionDto.prototype, "description", void 0);
__decorate([
    ApiPropertyOptional(),
    IsNumber(),
    IsOptional(),
    Type(() => Number),
    __metadata("design:type", Number)
], UpdatePositionDto.prototype, "level", void 0);
__decorate([
    ApiPropertyOptional(),
    IsBoolean(),
    IsOptional(),
    __metadata("design:type", Boolean)
], UpdatePositionDto.prototype, "isActive", void 0);
//# sourceMappingURL=position.dto.js.map