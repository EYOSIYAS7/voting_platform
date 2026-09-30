import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
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

import { ElectionService } from './election.service.js';
import {
  CreateElectionDto,
  UpdateElectionDto,
  PatchElectionStatusDto,
  CreateEligibilityRuleDto,
} from './dto/election.dto.js';

import { ElectionStatus } from './entities/election.entity.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { AuthenticatedUser } from '../../common/types/jwt-payload.types.js';

@ApiTags('elections')
@ApiBearerAuth()
@Controller('elections')
@UseGuards(PermissionsGuard)
export class ElectionController {
  constructor(private readonly service: ElectionService) {}

  /* ─────────────────── ELECTIONS CRUD ─────────────────── */

  @Post()
  @RequirePermissions('create:election')
  @ApiOperation({ summary: 'Create a new election (SYSTEM_ADMIN or ELECTION_ADMIN)' })
  create(@Body() dto: CreateElectionDto, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.service.create(dto, user.employeeId);
  }

  @Get()
  @ApiOperation({ summary: 'List elections (filterable by organizationId and status)' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ElectionStatus })
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: ElectionStatus,
  ) {
    return this.service.findAll(organizationId, status);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get all elections the authenticated employee is eligible for' })
  getMyElections(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.service.getMyElections(user.employeeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single election with its eligibility rules' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneWithRules(id);
  }

  @Put(':id')
  @RequirePermissions('update:election')
  @ApiOperation({ summary: 'Update a DRAFT election (SYSTEM_ADMIN or ELECTION_ADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateElectionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('update:election')
  @ApiOperation({ summary: 'Advance or cancel election status (SYSTEM_ADMIN or ELECTION_ADMIN)' })
  patchStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchElectionStatusDto,
  ) {
    return this.service.patchStatus(id, dto);
  }

  /* ─────────────── ELIGIBILITY RULES ─────────────────── */

  @Post(':id/eligibility-rules')
  @RequirePermissions('create:eligibility')
  @ApiOperation({ summary: 'Add an eligibility rule to an election' })
  addRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEligibilityRuleDto,
  ) {
    return this.service.addRule(id, dto);
  }

  @Get(':id/eligibility-rules')
  @ApiOperation({ summary: 'List eligibility rules for an election' })
  getRules(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getRules(id);
  }

  @Delete(':id/eligibility-rules/:ruleId')
  @RequirePermissions('delete:eligibility')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an eligibility rule' })
  removeRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
  ) {
    return this.service.removeRule(id, ruleId);
  }

  /* ─────────────── VOTER COMPUTATION ─────────────────── */

  @Post(':id/compute-voters')
  @RequirePermissions('update:election')
  @ApiOperation({
    summary:
      'Trigger (re)computation of eligible voters for an election. Safe to call multiple times.',
  })
  computeVoters(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.computeEligibleVoters(id);
  }

  @Get(':id/voters')
  @RequirePermissions('read:election')
  @ApiOperation({ summary: 'List pre-computed eligible voters for an election (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getVoters(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.service.getVoters(id, page, limit);
  }

  @Get(':id/my-eligibility')
  @ApiOperation({ summary: 'Check whether the authenticated employee is eligible to vote' })
  checkMyEligibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.service.checkMyEligibility(id, user.employeeId);
  }
}
