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
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity.js';
let OrganizationService = class OrganizationService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto) {
        const existing = await this.repo.findOne({ where: { name: dto.name } });
        if (existing) {
            throw new ConflictException(`Organization with name "${dto.name}" already exists`);
        }
        const org = this.repo.create(dto);
        return this.repo.save(org);
    }
    async findAll() {
        return this.repo.find({ order: { name: 'ASC' } });
    }
    async findOne(id) {
        const org = await this.repo.findOne({ where: { id }, relations: [] });
        if (!org)
            throw new NotFoundException(`Organization ${id} not found`);
        return org;
    }
    async update(id, dto) {
        const org = await this.findOne(id);
        Object.assign(org, dto);
        return this.repo.save(org);
    }
    async remove(id) {
        const org = await this.findOne(id);
        await this.repo.remove(org);
    }
};
OrganizationService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Organization)),
    __metadata("design:paramtypes", [Repository])
], OrganizationService);
export { OrganizationService };
//# sourceMappingURL=organization.service.js.map