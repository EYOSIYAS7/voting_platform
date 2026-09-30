import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
  IsBoolean,
  IsArray,
  ArrayUnique,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ElectionType, ElectionStatus } from '../entities/election.entity.js';

/* ─────────────────────────────────────────────────────── */
/* Election DTOs                                           */
/* ─────────────────────────────────────────────────────── */

export class CreateElectionDto {
  @ApiProperty({ example: 'Annual Board of Directors Election 2025' })
  @IsString()
  @MinLength(4)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Election of the board for FY2025' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'ccc69c16-5177-4d0a-89ee-042f08402abe' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ enum: ElectionType, default: ElectionType.GENERAL })
  @IsOptional()
  @IsEnum(ElectionType)
  electionType?: ElectionType;

  @ApiPropertyOptional({
    description: 'Root unit ID for UNIT_SCOPED elections',
    example: 'db155f70-d35d-4ae6-b918-d86ff349c378',
  })
  @IsOptional()
  @IsUUID()
  unitScopeId?: string;

  @ApiPropertyOptional({ example: '2025-11-01T08:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiProperty({ example: '2025-12-01T08:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-12-07T17:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: 0, description: '0 = unlimited candidates' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCandidates?: number;
}

export class UpdateElectionDto extends PartialType(CreateElectionDto) {}

export class PatchElectionStatusDto {
  @ApiProperty({ enum: ElectionStatus })
  @IsEnum(ElectionStatus)
  status: ElectionStatus;
}

/* ─────────────────────────────────────────────────────── */
/* EligibilityRule DTOs                                    */
/* ─────────────────────────────────────────────────────── */

export class CreateEligibilityRuleDto {
  @ApiPropertyOptional({ description: 'Unit ID to scope eligibility. Null = no unit restriction.' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ default: true, description: 'Include all recursive descendant units' })
  @IsOptional()
  @IsBoolean()
  includeDescendants?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of Position UUIDs allowed. Null = no position restriction.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  allowedPositionIds?: string[];

  @ApiPropertyOptional({ default: 0, description: 'Minimum tenure in full months' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minTenureMonths?: number;

  @ApiPropertyOptional({ default: 'ACTIVE', description: 'ACTIVE | INACTIVE | ANY' })
  @IsOptional()
  @IsString()
  requiredStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
