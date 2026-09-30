import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { VotingService } from './voting.service.js';
import { CastVoteDto, PublishElectionDto } from './dto/voting.dto.js';

import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { AuthenticatedUser } from '../../common/types/jwt-payload.types.js';

@ApiTags('voting')
@ApiBearerAuth()
@Controller('elections/:electionId')
@UseGuards(PermissionsGuard)
export class VotingController {
  constructor(private readonly service: VotingService) {}

  /* ──────────────────── ON-CHAIN PUBLISHING ────────────────────────── */

  @Post('publish-onchain')
  @RequirePermissions('update:election')
  @ApiOperation({
    summary:
      'Publish an election to the blockchain (ADMIN). Must be done before votes can be cast.',
  })
  @ApiParam({ name: 'electionId', type: String })
  publishElectionOnChain(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Body() dto: PublishElectionDto,
  ) {
    return this.service.publishElectionOnChain(electionId, dto);
  }

  @Post('candidates/:candidateId/publish-onchain')
  @RequirePermissions('update:election')
  @ApiOperation({
    summary:
      'Publish an APPROVED candidate to the blockchain (ADMIN). Election must be published first.',
  })
  @ApiParam({ name: 'electionId',  type: String })
  @ApiParam({ name: 'candidateId', type: String })
  publishCandidateOnChain(
    @Param('electionId',  ParseUUIDPipe) electionId: string,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    return this.service.publishCandidateOnChain(electionId, candidateId);
  }

  /* ──────────────────── VOTE CASTING ──────────────────────────────── */

  @Post('vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Cast a vote in an ACTIVE election. Server relays the tx on-chain. One vote per employee.',
  })
  @ApiParam({ name: 'electionId', type: String })
  castVote(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Body() dto: CastVoteDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.service.castVote(electionId, dto, user.employeeId);
  }

  /* ──────────────────── RESULTS & VERIFICATION ────────────────────── */

  @Get('results')
  @ApiOperation({
    summary:
      'Read live vote counts from the blockchain, enriched with DB candidate details.',
  })
  @ApiParam({ name: 'electionId', type: String })
  getResults(@Param('electionId', ParseUUIDPipe) electionId: string) {
    return this.service.getResults(electionId);
  }

  @Get('verify-vote')
  @ApiOperation({
    summary:
      'Get your own vote proof (tx hash + timestamp). Does NOT reveal which candidate you voted for.',
  })
  @ApiParam({ name: 'electionId', type: String })
  verifyMyVote(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.service.verifyMyVote(electionId, user.employeeId);
  }
}
