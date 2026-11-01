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
import { Injectable, NotFoundException, ConflictException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from './employee.entity.js';
import { Position } from '../position/position.entity.js';
import { OrganizationalUnit } from '../organizational-unit/organizational-unit.entity.js';
import { UserAccount } from '../auth/entities/user-account.entity.js';
import { Role, SystemRole } from '../auth/entities/role.entity.js';
import { UserRoleScope } from '../auth/entities/user-role-scope.entity.js';
const BCRYPT_ROUNDS = 12;
let EmployeeService = class EmployeeService {
    repo;
    positionRepo;
    unitRepo;
    accountRepo;
    roleRepo;
    scopeRepo;
    constructor(repo, positionRepo, unitRepo, accountRepo, roleRepo, scopeRepo) {
        this.repo = repo;
        this.positionRepo = positionRepo;
        this.unitRepo = unitRepo;
        this.accountRepo = accountRepo;
        this.roleRepo = roleRepo;
        this.scopeRepo = scopeRepo;
    }
    async onApplicationBootstrap() {
        try {
            const employees = await this.repo.find();
            for (const emp of employees) {
                await this.syncRoleAndScopeForEmployee(emp.id);
            }
        }
        catch (err) {
            console.error('Failed to sync employee roles and scopes on bootstrap:', err);
        }
    }
    async syncRoleAndScopeForEmployee(employeeId, grantedBy = 'SYSTEM_AUTO') {
        const emp = await this.repo.findOne({
            where: { id: employeeId },
            relations: ['position', 'organizationalUnit'],
        });
        if (!emp)
            return;
        let account = await this.accountRepo.findOne({ where: { employeeId: emp.id } });
        if (!account) {
            const passwordHash = await bcrypt.hash('ChangeMe@123', BCRYPT_ROUNDS);
            account = this.accountRepo.create({
                employeeId: emp.id,
                passwordHash,
                mustChangePassword: true,
                isActive: true,
            });
            account = await this.accountRepo.save(account);
        }
        const activePositions = await this.positionRepo.find({ where: { isActive: true } });
        const maxLevel = activePositions.length > 0
            ? Math.max(...activePositions.map((p) => p.level))
            : 99;
        const isLeastLevel = !emp.position || emp.position.level >= maxLevel;
        const targetRoleName = isLeastLevel ? SystemRole.EMPLOYEE : SystemRole.ELECTION_ADMIN;
        const targetRole = await this.roleRepo.findOne({ where: { name: targetRoleName } });
        const employeeRole = await this.roleRepo.findOne({ where: { name: SystemRole.EMPLOYEE } });
        if (!targetRole)
            return;
        const targetOrgUnitId = emp.organizationalUnitId ?? null;
        const existingScopes = await this.scopeRepo.find({
            where: { userId: account.id },
            relations: ['role'],
        });
        const scopesToRemove = existingScopes.filter((s) => s.role?.name === SystemRole.ELECTION_ADMIN || s.role?.name === SystemRole.EMPLOYEE);
        if (scopesToRemove.length > 0) {
            await this.scopeRepo.remove(scopesToRemove);
        }
        const newScopes = [];
        newScopes.push(this.scopeRepo.create({
            userId: account.id,
            roleId: targetRole.id,
            orgUnitId: targetOrgUnitId,
            grantedBy,
        }));
        if (targetRoleName === SystemRole.ELECTION_ADMIN && employeeRole) {
            newScopes.push(this.scopeRepo.create({
                userId: account.id,
                roleId: employeeRole.id,
                orgUnitId: targetOrgUnitId,
                grantedBy,
            }));
        }
        await this.scopeRepo.save(newScopes);
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
        const unit = await this.unitRepo.findOne({ where: { id: dto.organizationalUnitId } });
        if (!unit) {
            throw new NotFoundException(`Organizational unit ${dto.organizationalUnitId} not found`);
        }
        let position = null;
        if (dto.positionId) {
            position = await this.positionRepo.findOne({ where: { id: dto.positionId } });
            if (!position) {
                throw new NotFoundException(`Position ${dto.positionId} not found`);
            }
        }
        const employee = this.repo.create({
            ...dto,
            positionId: dto.positionId ?? null,
            hiredAt: dto.hiredAt ? new Date(dto.hiredAt) : undefined,
        });
        const saved = await this.repo.save(employee);
        await this.syncRoleAndScopeForEmployee(saved.id);
        return this.findOne(saved.id);
    }
    async findAll(filters) {
        const qb = this.repo
            .createQueryBuilder('employee')
            .leftJoinAndSelect('employee.organizationalUnit', 'organizationalUnit')
            .leftJoinAndSelect('employee.position', 'position');
        if (filters?.unitId) {
            qb.andWhere('employee.organizationalUnitId = :unitId', { unitId: filters.unitId });
        }
        if (filters?.status) {
            qb.andWhere('employee.status = :status', { status: filters.status });
        }
        if (filters?.positionId) {
            qb.andWhere('employee.positionId = :positionId', { positionId: filters.positionId });
        }
        if (filters?.search) {
            qb.andWhere('(LOWER(employee.firstName) LIKE :search OR LOWER(employee.lastName) LIKE :search OR LOWER(employee.email) LIKE :search OR LOWER(employee.employeeId) LIKE :search)', { search: `%${filters.search.toLowerCase()}%` });
        }
        return qb
            .orderBy('employee.lastName', 'ASC')
            .addOrderBy('employee.firstName', 'ASC')
            .getMany();
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
        if (dto.organizationalUnitId !== undefined) {
            const unit = await this.unitRepo.findOne({ where: { id: dto.organizationalUnitId } });
            if (!unit)
                throw new NotFoundException(`Organizational unit ${dto.organizationalUnitId} not found`);
            emp.organizationalUnitId = dto.organizationalUnitId;
            emp.organizationalUnit = unit;
        }
        if (dto.positionId !== undefined) {
            if (dto.positionId) {
                const pos = await this.positionRepo.findOne({ where: { id: dto.positionId } });
                if (!pos)
                    throw new NotFoundException(`Position ${dto.positionId} not found`);
                emp.positionId = dto.positionId;
                emp.position = pos;
            }
            else {
                emp.positionId = null;
                emp.position = null;
            }
        }
        if (dto.firstName !== undefined)
            emp.firstName = dto.firstName;
        if (dto.lastName !== undefined)
            emp.lastName = dto.lastName;
        if (dto.email !== undefined)
            emp.email = dto.email;
        if (dto.phone !== undefined)
            emp.phone = dto.phone;
        if (dto.status !== undefined)
            emp.status = dto.status;
        if (dto.hiredAt !== undefined)
            emp.hiredAt = dto.hiredAt ? new Date(dto.hiredAt) : emp.hiredAt;
        if (dto.profileImageUrl !== undefined)
            emp.profileImageUrl = dto.profileImageUrl;
        await this.repo.save(emp);
        await this.syncRoleAndScopeForEmployee(emp.id);
        return this.findOne(id);
    }
    async remove(id) {
        const emp = await this.findOne(id);
        await this.repo.remove(emp);
    }
};
EmployeeService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Employee)),
    __param(1, InjectRepository(Position)),
    __param(2, InjectRepository(OrganizationalUnit)),
    __param(3, InjectRepository(UserAccount)),
    __param(4, InjectRepository(Role)),
    __param(5, InjectRepository(UserRoleScope)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository])
], EmployeeService);
export { EmployeeService };
//# sourceMappingURL=employee.service.js.map