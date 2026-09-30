var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, Get, Body, Param, ParseUUIDPipe, UseGuards, Req, HttpCode, HttpStatus, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, } from '@nestjs/swagger';
import { VotingService } from './voting.service.js';
import { CastVoteDto, PublishElectionDto } from './dto/voting.dto.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
let VotingController = class VotingController {
    service;
    constructor(service) {
        this.service = service;
    }
    publishElectionOnChain(electionId, dto) {
        return this.service.publishElectionOnChain(electionId, dto);
    }
    publishCandidateOnChain(electionId, candidateId) {
        return this.service.publishCandidateOnChain(electionId, candidateId);
    }
    castVote(electionId, dto, req) {
        const user = req.user;
        return this.service.castVote(electionId, dto, user.employeeId);
    }
    getResults(electionId) {
        return this.service.getResults(electionId);
    }
    verifyMyVote(electionId, req) {
        const user = req.user;
        return this.service.verifyMyVote(electionId, user.employeeId);
    }
};
__decorate([
    Post('publish-onchain'),
    RequirePermissions('update:election'),
    ApiOperation({
        summary: 'Publish an election to the blockchain (ADMIN). Must be done before votes can be cast.',
    }),
    ApiParam({ name: 'electionId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, PublishElectionDto]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "publishElectionOnChain", null);
__decorate([
    Post('candidates/:candidateId/publish-onchain'),
    RequirePermissions('update:election'),
    ApiOperation({
        summary: 'Publish an APPROVED candidate to the blockchain (ADMIN). Election must be published first.',
    }),
    ApiParam({ name: 'electionId', type: String }),
    ApiParam({ name: 'candidateId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Param('candidateId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "publishCandidateOnChain", null);
__decorate([
    Post('vote'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
        summary: 'Cast a vote in an ACTIVE election. Server relays the tx on-chain. One vote per employee.',
    }),
    ApiParam({ name: 'electionId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Body()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CastVoteDto, Object]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "castVote", null);
__decorate([
    Get('results'),
    ApiOperation({
        summary: 'Read live vote counts from the blockchain, enriched with DB candidate details.',
    }),
    ApiParam({ name: 'electionId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "getResults", null);
__decorate([
    Get('verify-vote'),
    ApiOperation({
        summary: 'Get your own vote proof (tx hash + timestamp). Does NOT reveal which candidate you voted for.',
    }),
    ApiParam({ name: 'electionId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VotingController.prototype, "verifyMyVote", null);
VotingController = __decorate([
    ApiTags('voting'),
    ApiBearerAuth(),
    Controller('elections/:electionId'),
    UseGuards(PermissionsGuard),
    __metadata("design:paramtypes", [VotingService])
], VotingController);
export { VotingController };
//# sourceMappingURL=voting.controller.js.map