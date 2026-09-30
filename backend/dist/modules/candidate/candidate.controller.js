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
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, UseGuards, Req, HttpCode, HttpStatus, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, } from '@nestjs/swagger';
import { CandidateService } from './candidate.service.js';
import { NominateCandidateDto, SelfNominateDto, UpdateCandidateDto, ReviewCandidateDto, } from './dto/candidate.dto.js';
import { CandidateStatus } from './entities/candidate.entity.js';
import { SystemRole } from '../auth/entities/role.entity.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
function isAdminUser(user) {
    return (user.roles.includes(SystemRole.SYSTEM_ADMIN) ||
        user.roles.includes(SystemRole.ELECTION_ADMIN));
}
let CandidateController = class CandidateController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(electionId, status) {
        return this.service.findAll(electionId, status);
    }
    getMyCandidacy(electionId, req) {
        const user = req.user;
        return this.service.getMyCandidacy(electionId, user.employeeId);
    }
    findOne(electionId, candidateId) {
        return this.service.findOne(electionId, candidateId);
    }
    nominateByAdmin(electionId, dto, req) {
        const user = req.user;
        return this.service.nominateByAdmin(electionId, dto, user.employeeId);
    }
    selfNominate(electionId, dto, req) {
        const user = req.user;
        return this.service.selfNominate(electionId, dto, user.employeeId);
    }
    update(electionId, candidateId, dto, req) {
        const user = req.user;
        return this.service.update(electionId, candidateId, dto, user.employeeId, isAdminUser(user));
    }
    review(electionId, candidateId, dto, req) {
        const user = req.user;
        return this.service.review(electionId, candidateId, dto, user.employeeId);
    }
    withdraw(electionId, candidateId, req) {
        const user = req.user;
        return this.service.withdraw(electionId, candidateId, user.employeeId, isAdminUser(user));
    }
    remove(electionId, candidateId) {
        return this.service.remove(electionId, candidateId);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'List candidates for an election (filterable by status)' }),
    ApiParam({ name: 'electionId', type: String }),
    ApiQuery({ name: 'status', required: false, enum: CandidateStatus }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Query('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CandidateController.prototype, "findAll", null);
__decorate([
    Get('me'),
    ApiOperation({ summary: 'Get my own candidacy in this election (if any)' }),
    ApiParam({ name: 'electionId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CandidateController.prototype, "getMyCandidacy", null);
__decorate([
    Get(':candidateId'),
    ApiOperation({ summary: 'Get a single candidate by ID' }),
    ApiParam({ name: 'electionId', type: String }),
    ApiParam({ name: 'candidateId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Param('candidateId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CandidateController.prototype, "findOne", null);
__decorate([
    Post('nominate'),
    RequirePermissions('create:candidate'),
    ApiOperation({ summary: 'Admin nominates an employee as a candidate (ADMIN only)' }),
    ApiParam({ name: 'electionId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Body()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, NominateCandidateDto, Object]),
    __metadata("design:returntype", void 0)
], CandidateController.prototype, "nominateByAdmin", null);
__decorate([
    Post('self-nominate'),
    ApiOperation({ summary: 'Employee self-nominates for an election' }),
    ApiParam({ name: 'electionId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Body()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SelfNominateDto, Object]),
    __metadata("design:returntype", void 0)
], CandidateController.prototype, "selfNominate", null);
__decorate([
    Patch(':candidateId'),
    ApiOperation({
        summary: 'Update candidate statement / slogan / photo. Own candidate or admin only.',
    }),
    ApiParam({ name: 'electionId', type: String }),
    ApiParam({ name: 'candidateId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Param('candidateId', ParseUUIDPipe)),
    __param(2, Body()),
    __param(3, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateCandidateDto, Object]),
    __metadata("design:returntype", void 0)
], CandidateController.prototype, "update", null);
__decorate([
    Patch(':candidateId/review'),
    RequirePermissions('update:candidate'),
    ApiOperation({
        summary: 'Admin approves or rejects a PENDING candidate (SYSTEM_ADMIN / ELECTION_ADMIN)',
    }),
    ApiParam({ name: 'electionId', type: String }),
    ApiParam({ name: 'candidateId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Param('candidateId', ParseUUIDPipe)),
    __param(2, Body()),
    __param(3, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ReviewCandidateDto, Object]),
    __metadata("design:returntype", void 0)
], CandidateController.prototype, "review", null);
__decorate([
    Patch(':candidateId/withdraw'),
    ApiOperation({
        summary: 'Withdraw a candidacy. Own candidate or admin. Not allowed once election is ACTIVE.',
    }),
    ApiParam({ name: 'electionId', type: String }),
    ApiParam({ name: 'candidateId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Param('candidateId', ParseUUIDPipe)),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CandidateController.prototype, "withdraw", null);
__decorate([
    Delete(':candidateId'),
    RequirePermissions('delete:candidate'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Hard-delete a candidate entry (ADMIN only, not allowed in ACTIVE/ENDED elections)' }),
    ApiParam({ name: 'electionId', type: String }),
    ApiParam({ name: 'candidateId', type: String }),
    __param(0, Param('electionId', ParseUUIDPipe)),
    __param(1, Param('candidateId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CandidateController.prototype, "remove", null);
CandidateController = __decorate([
    ApiTags('candidates'),
    ApiBearerAuth(),
    Controller('elections/:electionId/candidates'),
    UseGuards(PermissionsGuard),
    __metadata("design:paramtypes", [CandidateService])
], CandidateController);
export { CandidateController };
//# sourceMappingURL=candidate.controller.js.map