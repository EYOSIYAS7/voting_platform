import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsUrl,
} from 'class-validator';
import { CandidateStatus } from '../entities/candidate.entity.js';

/* ──────────────────────────────────────────────────── */
/* Nomination (Create)                                  */
/* ──────────────────────────────────────────────────── */

export class NominateCandidateDto {
  @ApiProperty({
    description: 'Employee UUID to nominate as a candidate',
    example: '8188f870-251d-47d6-9ce7-9a168eb1d01f',
  })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({
    description: 'Campaign statement / bio (max 2000 chars)',
    example: 'I will champion transparency and accountability...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  statement?: string;

  @ApiPropertyOptional({
    description: 'Short campaign slogan (max 200 chars)',
    example: 'Security First, Always.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slogan?: string;

  @ApiPropertyOptional({
    description: 'URL to a candidate campaign photo',
    example: 'https://cdn.insa.gov.et/candidates/photo.jpg',
  })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}

/* ──────────────────────────────────────────────────── */
/* Self-Nomination (Employee nominates themselves)       */
/* ──────────────────────────────────────────────────── */

export class SelfNominateDto {
  @ApiPropertyOptional({
    description: 'Campaign statement / bio (max 2000 chars)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  statement?: string;

  @ApiPropertyOptional({
    description: 'Short campaign slogan (max 200 chars)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slogan?: string;

  @ApiPropertyOptional({
    description: 'URL to a candidate campaign photo',
  })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}

/* ──────────────────────────────────────────────────── */
/* Update candidacy details                             */
/* ──────────────────────────────────────────────────── */

export class UpdateCandidateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  statement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slogan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}

/* ──────────────────────────────────────────────────── */
/* Review (Approve / Reject)                            */
/* ──────────────────────────────────────────────────── */

export class ReviewCandidateDto {
  @ApiProperty({
    enum: [CandidateStatus.APPROVED, CandidateStatus.REJECTED],
    description: 'Admin decision — APPROVED or REJECTED',
  })
  @IsEnum([CandidateStatus.APPROVED, CandidateStatus.REJECTED])
  status: CandidateStatus.APPROVED | CandidateStatus.REJECTED;

  @ApiPropertyOptional({
    description: 'Required when status is REJECTED. Reason for rejection.',
    example: 'Candidate does not meet minimum tenure requirement.',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  rejectionReason?: string;
}
