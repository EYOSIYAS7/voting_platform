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
import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, Query, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrganizationalUnitService } from './organizational-unit.service.js';
import { CreateOrganizationalUnitDto, UpdateOrganizationalUnitDto, } from './dto/organizational-unit.dto.js';
let OrganizationalUnitController = class OrganizationalUnitController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findAll(organizationId) {
        return this.service.findAll(organizationId);
    }
    getTree(organizationId) {
        return this.service.getTree(organizationId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    getDescendants(id) {
        return this.service.getDescendantIds(id);
    }
    getAncestors(id) {
        return this.service.getAncestors(id);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new organizational unit' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateOrganizationalUnitDto]),
    __metadata("design:returntype", void 0)
], OrganizationalUnitController.prototype, "create", null);
__decorate([
    Get(),
    ApiOperation({ summary: 'List all units for an organization (flat list)' }),
    ApiQuery({ name: 'organizationId', required: true, type: String }),
    __param(0, Query('organizationId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationalUnitController.prototype, "findAll", null);
__decorate([
    Get('tree'),
    ApiOperation({ summary: 'Get nested tree structure for an organization' }),
    ApiQuery({ name: 'organizationId', required: true, type: String }),
    __param(0, Query('organizationId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationalUnitController.prototype, "getTree", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get a single organizational unit' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationalUnitController.prototype, "findOne", null);
__decorate([
    Get(':id/descendants'),
    ApiOperation({ summary: 'Get all descendant unit IDs (for scope calculation)' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationalUnitController.prototype, "getDescendants", null);
__decorate([
    Get(':id/ancestors'),
    ApiOperation({ summary: 'Get ancestor chain / breadcrumb for a unit' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationalUnitController.prototype, "getAncestors", null);
__decorate([
    Patch(':id'),
    ApiOperation({ summary: 'Update an organizational unit' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateOrganizationalUnitDto]),
    __metadata("design:returntype", void 0)
], OrganizationalUnitController.prototype, "update", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete an organizational unit (must have no children)' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationalUnitController.prototype, "remove", null);
OrganizationalUnitController = __decorate([
    ApiTags('organizational-units'),
    Controller('organizational-units'),
    __metadata("design:paramtypes", [OrganizationalUnitService])
], OrganizationalUnitController);
export { OrganizationalUnitController };
//# sourceMappingURL=organizational-unit.controller.js.map