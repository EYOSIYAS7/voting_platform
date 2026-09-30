import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { CandidateService } from './candidate.service.js';
import {
  NominateCandidateDto,
  SelfNominateDto,
  UpdateCandidateDto,
  ReviewCandidateDto,
} from './dto/candidate.dto.js';

import { CandidateStatus } from './entities/candidate.entity.js';
import { SystemRole } from '../auth/entities/role.entity.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { AuthenticatedUser } from '../../common/types/jwt-payload.types.js';

/** Helper: returns true if the authenticated user has SYSTEM_ADMIN or ELECTION_ADMIN role */
function isAdminUser(user: AuthenticatedUser): boolean {
  return (
    user.roles.includes(SystemRole.SYSTEM_ADMIN) ||
    user.roles.includes(SystemRole.ELECTION_ADMIN)
  );
}

@ApiTags('candidates')
@ApiBearerAuth()
@Controller('elections/:electionId/candidates')
@UseGuards(PermissionsGuard)
export class CandidateController {
  constructor(private readonly service: CandidateService) {}

  /* ─────────────────── LIST & GET ─────────────────── */

  @Get()
  @ApiOperation({ summary: 'List candidates for an election (filterable by status)' })
  @ApiParam({ name: 'electionId', type: String })
  @ApiQuery({ name: 'status', required: false, enum: CandidateStatus })
  findAll(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Query('status') status?: CandidateStatus,
  ) {
    return this.service.findAll(electionId, status);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my own candidacy in this election (if any)' })
  @ApiParam({ name: 'electionId', type: String })
  getMyCandidacy(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.service.getMyCandidacy(electionId, user.employeeId);
  }

  @Get(':candidateId')
  @ApiOperation({ summary: 'Get a single candidate by ID' })
  @ApiParam({ name: 'electionId', type: String })
  @ApiParam({ name: 'candidateId', type: String })
  findOne(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    return this.service.findOne(electionId, candidateId);
  }

  /* ─────────────────── NOMINATIONS ────────────────── */

  @Post('nominate')
  @RequirePermissions('create:candidate')
  @ApiOperation({ summary: 'Admin nominates an employee as a candidate (ADMIN only)' })
  @ApiParam({ name: 'electionId', type: String })
  nominateByAdmin(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Body() dto: NominateCandidateDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.service.nominateByAdmin(electionId, dto, user.employeeId);
  }

  @Post('self-nominate')
  @ApiOperation({ summary: 'Employee self-nominates for an election' })
  @ApiParam({ name: 'electionId', type: String })
  selfNominate(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Body() dto: SelfNominateDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.service.selfNominate(electionId, dto, user.employeeId);
  }

  /* ─────────────────── UPDATE PROFILE ─────────────── */

  @Patch(':candidateId')
  @ApiOperation({
    summary:
      'Update candidate statement / slogan / photo. Own candidate or admin only.',
  })
  @ApiParam({ name: 'electionId', type: String })
  @ApiParam({ name: 'candidateId', type: String })
  update(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() dto: UpdateCandidateDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.service.update(electionId, candidateId, dto, user.employeeId, isAdminUser(user));
  }

  /* ─────────────────── REVIEW WORKFLOW ────────────── */

  @Patch(':candidateId/review')
  @RequirePermissions('update:candidate')
  @ApiOperation({
    summary:
      'Admin approves or rejects a PENDING candidate (SYSTEM_ADMIN / ELECTION_ADMIN)',
  })
  @ApiParam({ name: 'electionId', type: String })
  @ApiParam({ name: 'candidateId', type: String })
  review(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() dto: ReviewCandidateDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.service.review(electionId, candidateId, dto, user.employeeId);
  }

  /* ─────────────────── WITHDRAWAL ─────────────────── */

  @Patch(':candidateId/withdraw')
  @ApiOperation({
    summary:
      'Withdraw a candidacy. Own candidate or admin. Not allowed once election is ACTIVE.',
  })
  @ApiParam({ name: 'electionId', type: String })
  @ApiParam({ name: 'candidateId', type: String })
  withdraw(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.service.withdraw(electionId, candidateId, user.employeeId, isAdminUser(user));
  }

  /* ─────────────────── DELETE ─────────────────────── */

  @Delete(':candidateId')
  @RequirePermissions('delete:candidate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a candidate entry (ADMIN only, not allowed in ACTIVE/ENDED elections)' })
  @ApiParam({ name: 'electionId', type: String })
  @ApiParam({ name: 'candidateId', type: String })
  remove(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    return this.service.remove(electionId, candidateId);
  }
}
