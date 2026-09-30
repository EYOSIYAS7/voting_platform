var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsUUID, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class LoginDto {
    email;
    password;
}
__decorate([
    ApiProperty({ example: 'john.doe@org.com' }),
    IsEmail(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    ApiProperty({ example: 'MySecureP@ssw0rd' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
export class ChangePasswordDto {
    currentPassword;
    newPassword;
}
__decorate([
    ApiProperty(),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    ApiProperty({ minLength: 8 }),
    IsString(),
    MinLength(8),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
export class CreateAccountDto {
    employeeId;
    temporaryPassword;
}
__decorate([
    ApiProperty(),
    IsUUID(),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "employeeId", void 0);
__decorate([
    ApiProperty({ minLength: 8, description: 'Temporary password; user must change on first login' }),
    IsString(),
    MinLength(8),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "temporaryPassword", void 0);
export class AssignRoleDto {
    userId;
    roleId;
    orgUnitId;
}
__decorate([
    ApiProperty({ description: 'UserAccount UUID' }),
    IsUUID(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "userId", void 0);
__decorate([
    ApiProperty({ description: 'Role UUID' }),
    IsUUID(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "roleId", void 0);
__decorate([
    ApiPropertyOptional({ description: 'OrganizationalUnit UUID — null means global scope' }),
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "orgUnitId", void 0);
export class TokenResponseDto {
    accessToken;
    expiresIn;
    mustChangePassword;
}
__decorate([
    ApiProperty(),
    __metadata("design:type", String)
], TokenResponseDto.prototype, "accessToken", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", String)
], TokenResponseDto.prototype, "expiresIn", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", Boolean)
], TokenResponseDto.prototype, "mustChangePassword", void 0);
//# sourceMappingURL=auth.dto.js.map