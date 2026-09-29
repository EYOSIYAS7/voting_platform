import {
  IsString, IsOptional, IsNotEmpty, IsEnum, IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitType } from '../organizational-unit.entity.js';

export class CreateOrganizationalUnitDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({ description: 'Parent unit ID — omit for top-level units' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ example: 'IT Directorate' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: UnitType })
  @IsEnum(UnitType)
  unitType: UnitType;

  @ApiPropertyOptional({ description: 'UUID of the employee who heads this unit' })
  @IsUUID()
  @IsOptional()
  headEmployeeId?: string;
}

export class UpdateOrganizationalUnitDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: UnitType })
  @IsEnum(UnitType)
  @IsOptional()
  unitType?: UnitType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  headEmployeeId?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsString()
  @IsOptional()
  status?: string;
}
