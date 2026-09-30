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
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe, UseGuards, Req, HttpCode, HttpStatus, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, } from '@nestjs/swagger';
import { ElectionService } from './election.service.js';
import { CreateElectionDto, UpdateElectionDto, PatchElectionStatusDto, CreateEligibilityRuleDto, } from './dto/election.dto.js';
import { ElectionStatus } from './entities/election.entity.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
let ElectionController = class ElectionController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        const user = req.user;
        return this.service.create(dto, user.employeeId);
    }
    findAll(organizationId, status) {
        return this.service.findAll(organizationId, status);
    }
    getMyElections(req) {
        const user = req.user;
        return this.service.getMyElections(user.employeeId);
    }
    findOne(id) {
        return this.service.findOneWithRules(id);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    patchStatus(id, dto) {
        return this.service.patchStatus(id, dto);
    }
    addRule(id, dto) {
        return this.service.addRule(id, dto);
    }
    getRules(id) {
        return this.service.getRules(id);
    }
    removeRule(id, ruleId) {
        return this.service.removeRule(id, ruleId);
    }
    computeVoters(id) {
        return this.service.computeEligibleVoters(id);
    }
    getVoters(id, page, limit) {
        return this.service.getVoters(id, page, limit);
    }
    checkMyEligibility(id, req) {
        const user = req.user;
        return this.service.checkMyEligibility(id, user.employeeId);
    }
};
__decorate([
    Post(),
    RequirePermissions('create:election'),
    ApiOperation({ summary: 'Create a new election (SYSTEM_ADMIN or ELECTION_ADMIN)' }),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateElectionDto, Object]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "create", null);
__decorate([
    Get(),
    ApiOperation({ summary: 'List elections (filterable by organizationId and status)' }),
    ApiQuery({ name: 'organizationId', required: false }),
    ApiQuery({ name: 'status', required: false, enum: ElectionStatus }),
    __param(0, Query('organizationId')),
    __param(1, Query('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "findAll", null);
__decorate([
    Get('mine'),
    ApiOperation({ summary: 'Get all elections the authenticated employee is eligible for' }),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "getMyElections", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get a single election with its eligibility rules' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "findOne", null);
__decorate([
    Put(':id'),
    RequirePermissions('update:election'),
    ApiOperation({ summary: 'Update a DRAFT election (SYSTEM_ADMIN or ELECTION_ADMIN)' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateElectionDto]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "update", null);
__decorate([
    Patch(':id/status'),
    RequirePermissions('update:election'),
    ApiOperation({ summary: 'Advance or cancel election status (SYSTEM_ADMIN or ELECTION_ADMIN)' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, PatchElectionStatusDto]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "patchStatus", null);
__decorate([
    Post(':id/eligibility-rules'),
    RequirePermissions('create:eligibility'),
    ApiOperation({ summary: 'Add an eligibility rule to an election' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateEligibilityRuleDto]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "addRule", null);
__decorate([
    Get(':id/eligibility-rules'),
    ApiOperation({ summary: 'List eligibility rules for an election' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "getRules", null);
__decorate([
    Delete(':id/eligibility-rules/:ruleId'),
    RequirePermissions('delete:eligibility'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Remove an eligibility rule' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Param('ruleId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "removeRule", null);
__decorate([
    Post(':id/compute-voters'),
    RequirePermissions('update:election'),
    ApiOperation({
        summary: 'Trigger (re)computation of eligible voters for an election. Safe to call multiple times.',
    }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "computeVoters", null);
__decorate([
    Get(':id/voters'),
    RequirePermissions('read:election'),
    ApiOperation({ summary: 'List pre-computed eligible voters for an election (paginated)' }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Query('page', new DefaultValuePipe(1), ParseIntPipe)),
    __param(2, Query('limit', new DefaultValuePipe(50), ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "getVoters", null);
__decorate([
    Get(':id/my-eligibility'),
    ApiOperation({ summary: 'Check whether the authenticated employee is eligible to vote' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ElectionController.prototype, "checkMyEligibility", null);
ElectionController = __decorate([
    ApiTags('elections'),
    ApiBearerAuth(),
    Controller('elections'),
    UseGuards(PermissionsGuard),
    __metadata("design:paramtypes", [ElectionService])
], ElectionController);
export { ElectionController };
//# sourceMappingURL=election.controller.js.map