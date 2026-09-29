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
import { Position } from './position.entity.js';
let PositionService = class PositionService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto) {
        const existing = await this.repo.findOne({ where: { name: dto.name } });
        if (existing) {
            throw new ConflictException(`Position "${dto.name}" already exists`);
        }
        return this.repo.save(this.repo.create(dto));
    }
    async findAll() {
        return this.repo.find({ order: { level: 'ASC', name: 'ASC' } });
    }
    async findOne(id) {
        const pos = await this.repo.findOne({ where: { id } });
        if (!pos)
            throw new NotFoundException(`Position ${id} not found`);
        return pos;
    }
    async update(id, dto) {
        const pos = await this.findOne(id);
        Object.assign(pos, dto);
        return this.repo.save(pos);
    }
    async remove(id) {
        const pos = await this.findOne(id);
        await this.repo.remove(pos);
    }
};
PositionService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Position)),
    __metadata("design:paramtypes", [Repository])
], PositionService);
export { PositionService };
//# sourceMappingURL=position.service.js.map