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
import { Employee } from './employee.entity.js';
let EmployeeService = class EmployeeService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto) {
        const existingEmail = await this.repo.findOne({ where: { email: dto.email } });
        if (existingEmail) {
            throw new ConflictException(`An employee with email "${dto.email}" already exists`);
        }
        const existingId = await this.repo.findOne({ where: { employeeId: dto.employeeId } });
        if (existingId) {
            throw new ConflictException(`Employee ID "${dto.employeeId}" is already in use`);
        }
        const employee = this.repo.create({
            ...dto,
            hiredAt: dto.hiredAt ? new Date(dto.hiredAt) : undefined,
        });
        return this.repo.save(employee);
    }
    async findAll(filters) {
        const where = {};
        if (filters?.unitId)
            Object.assign(where, { organizationalUnitId: filters.unitId });
        if (filters?.status)
            Object.assign(where, { status: filters.status });
        if (filters?.positionId)
            Object.assign(where, { positionId: filters.positionId });
        return this.repo.find({
            where,
            relations: ['organizationalUnit', 'position'],
            order: { lastName: 'ASC', firstName: 'ASC' },
        });
    }
    async findByUnitIds(unitIds, status) {
        const qb = this.repo
            .createQueryBuilder('employee')
            .leftJoinAndSelect('employee.organizationalUnit', 'unit')
            .leftJoinAndSelect('employee.position', 'position')
            .where('employee.organizationalUnitId IN (:...unitIds)', { unitIds });
        if (status) {
            qb.andWhere('employee.status = :status', { status });
        }
        return qb.getMany();
    }
    async findOne(id) {
        const emp = await this.repo.findOne({
            where: { id },
            relations: ['organizationalUnit', 'position'],
        });
        if (!emp)
            throw new NotFoundException(`Employee ${id} not found`);
        return emp;
    }
    async findByEmail(email) {
        return this.repo.findOne({ where: { email }, relations: ['organizationalUnit', 'position'] });
    }
    async findByEmployeeId(employeeId) {
        return this.repo.findOne({ where: { employeeId }, relations: ['organizationalUnit', 'position'] });
    }
    async update(id, dto) {
        const emp = await this.findOne(id);
        if (dto.email && dto.email !== emp.email) {
            const conflict = await this.repo.findOne({ where: { email: dto.email } });
            if (conflict)
                throw new ConflictException(`Email "${dto.email}" is already in use`);
        }
        Object.assign(emp, {
            ...dto,
            hiredAt: dto.hiredAt ? new Date(dto.hiredAt) : emp.hiredAt,
        });
        return this.repo.save(emp);
    }
    async remove(id) {
        const emp = await this.findOne(id);
        await this.repo.remove(emp);
    }
};
EmployeeService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Employee)),
    __metadata("design:paramtypes", [Repository])
], EmployeeService);
export { EmployeeService };
//# sourceMappingURL=employee.service.js.map