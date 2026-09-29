import {
  IsString, IsOptional, IsNotEmpty, IsEmail, IsEnum,
  IsUUID, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus } from '../employee.entity.js';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-001' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'UUID of the organizational unit this employee belongs to' })
  @IsUUID()
  organizationalUnitId: string;

  @ApiPropertyOptional({ description: 'UUID of the employee position' })
  @IsUUID()
  @IsOptional()
  positionId?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus, default: EmployeeStatus.PENDING })
  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  hiredAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  organizationalUnitId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  positionId?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  hiredAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}
