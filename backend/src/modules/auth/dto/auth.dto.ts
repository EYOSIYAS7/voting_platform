import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Login ─────────────────────────────────────────────────────────────────────

export class LoginDto {
  @ApiProperty({ example: 'john.doe@org.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MySecureP@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

// ── Change Password ───────────────────────────────────────────────────────────

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

// ── Create Account (admin creates for an employee) ────────────────────────────

export class CreateAccountDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ minLength: 8, description: 'Temporary password; user must change on first login' })
  @IsString()
  @MinLength(8)
  temporaryPassword: string;
}

// ── Assign Role ───────────────────────────────────────────────────────────────

export class AssignRoleDto {
  @ApiProperty({ description: 'UserAccount UUID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Role UUID' })
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({ description: 'OrganizationalUnit UUID — null means global scope' })
  @IsOptional()
  @IsUUID()
  orgUnitId?: string;
}

// ── Token Response ────────────────────────────────────────────────────────────

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  expiresIn: string;

  @ApiProperty()
  mustChangePassword: boolean;
}
