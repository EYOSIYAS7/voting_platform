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
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrganizationalUnit } from './organizational-unit.entity.js';
let OrganizationalUnitService = class OrganizationalUnitService {
    repo;
    dataSource;
    constructor(repo, dataSource) {
        this.repo = repo;
        this.dataSource = dataSource;
    }
    async create(dto) {
        if (dto.parentId) {
            const parent = await this.repo.findOne({ where: { id: dto.parentId } });
            if (!parent)
                throw new NotFoundException(`Parent unit ${dto.parentId} not found`);
            if (parent.organizationId !== dto.organizationId) {
                throw new BadRequestException('Parent unit belongs to a different organization');
            }
        }
        const unit = this.repo.create(dto);
        return this.repo.save(unit);
    }
    async findAll(organizationId) {
        return this.repo.find({
            where: { organizationId },
            relations: ['parent', 'children'],
            order: { name: 'ASC' },
        });
    }
    async findOne(id) {
        const unit = await this.repo.findOne({
            where: { id },
            relations: ['parent', 'children', 'organization'],
        });
        if (!unit)
            throw new NotFoundException(`Organizational unit ${id} not found`);
        return unit;
    }
    async getDescendantIds(unitId) {
        const rows = await this.dataSource.query(`
      WITH RECURSIVE descendants AS (
        SELECT id FROM organizational_units WHERE id = $1
        UNION ALL
        SELECT u.id FROM organizational_units u
        INNER JOIN descendants d ON u."parentId" = d.id
      )
      SELECT id FROM descendants
      `, [unitId]);
        return rows.map((r) => r.id);
    }
    async getAncestors(unitId) {
        const rows = await this.dataSource.query(`
      WITH RECURSIVE ancestors AS (
        SELECT id, "parentId", name, "unitType" FROM organizational_units WHERE id = $1
        UNION ALL
        SELECT u.id, u."parentId", u.name, u."unitType"
        FROM organizational_units u
        INNER JOIN ancestors a ON u.id = a."parentId"
      )
      SELECT id FROM ancestors
      `, [unitId]);
        const ids = rows.map((r) => r.id);
        if (ids.length === 0)
            return [];
        return this.repo
            .createQueryBuilder('unit')
            .where('unit.id IN (:...ids)', { ids })
            .getMany();
    }
    async update(id, dto) {
        const unit = await this.findOne(id);
        if (dto.parentId && dto.parentId === id) {
            throw new BadRequestException('A unit cannot be its own parent');
        }
        if (dto.parentId) {
            const descendants = await this.getDescendantIds(id);
            if (descendants.includes(dto.parentId)) {
                throw new BadRequestException('Cannot set a descendant unit as parent (circular hierarchy)');
            }
        }
        Object.assign(unit, dto);
        return this.repo.save(unit);
    }
    async remove(id) {
        const unit = await this.findOne(id);
        const children = await this.repo.find({ where: { parentId: id } });
        if (children.length > 0) {
            throw new BadRequestException('Cannot delete a unit that has child units. Reassign or delete children first.');
        }
        await this.repo.remove(unit);
    }
    async getTree(organizationId) {
        const all = await this.repo.find({
            where: { organizationId },
            order: { name: 'ASC' },
        });
        const map = new Map();
        all.forEach((u) => map.set(u.id, { ...u, children: [] }));
        const roots = [];
        map.forEach((unit) => {
            if (unit.parentId && map.has(unit.parentId)) {
                map.get(unit.parentId).children.push(unit);
            }
            else {
                roots.push(unit);
            }
        });
        return roots;
    }
};
OrganizationalUnitService = __decorate([
    Injectable(),
    __param(0, InjectRepository(OrganizationalUnit)),
    __metadata("design:paramtypes", [Repository,
        DataSource])
], OrganizationalUnitService);
export { OrganizationalUnitService };
//# sourceMappingURL=organizational-unit.service.js.map