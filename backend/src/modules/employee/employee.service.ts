import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Employee, EmployeeStatus } from './employee.entity.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto.js';
import { Position } from '../position/position.entity.js';
import { OrganizationalUnit } from '../organizational-unit/organizational-unit.entity.js';
import { UserAccount } from '../auth/entities/user-account.entity.js';
import { Role, SystemRole } from '../auth/entities/role.entity.js';
import { UserRoleScope } from '../auth/entities/user-role-scope.entity.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class EmployeeService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,

    @InjectRepository(Position)
    private readonly positionRepo: Repository<Position>,

    @InjectRepository(OrganizationalUnit)
    private readonly unitRepo: Repository<OrganizationalUnit>,

    @InjectRepository(UserAccount)
    private readonly accountRepo: Repository<UserAccount>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(UserRoleScope)
    private readonly scopeRepo: Repository<UserRoleScope>,
  ) {}

  /**
   * Automatically synchronizes roles and unit scopes for all existing employees on application startup.
   */
  async onApplicationBootstrap() {
    try {
      const employees = await this.repo.find();
      for (const emp of employees) {
        await this.syncRoleAndScopeForEmployee(emp.id);
      }
    } catch (err) {
      console.error('Failed to sync employee roles and scopes on bootstrap:', err);
    }
  }

  /**
   * Automatically assigns or updates role and unit scope for an employee:
   * - Positions with the least level (lowest hierarchical rank / highest level number) get EMPLOYEE role.
   * - Positions with higher level than the least level (lower level number) get ELECTION_ADMIN role.
   * - Unit scope is automatically assigned to the employee's organizational unit.
   * - If the user account already has SYSTEM_ADMIN, SYSTEM_ADMIN is preserved.
   */
  async syncRoleAndScopeForEmployee(employeeId: string, grantedBy = 'SYSTEM_AUTO'): Promise<void> {
    const emp = await this.repo.findOne({
      where: { id: employeeId },
      relations: ['position', 'organizationalUnit'],
    });
    if (!emp) return;

    // 1. Ensure user account exists
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

    // 2. Find the least level among all active positions (where 1 = Top Rank, highest number = lowest rank)
    const activePositions = await this.positionRepo.find({ where: { isActive: true } });
    const maxLevel = activePositions.length > 0
      ? Math.max(...activePositions.map((p) => p.level))
      : 99;

    // 3. Determine target role
    // If no position assigned or level >= maxLevel -> least level -> EMPLOYEE
    // If level < maxLevel -> higher rank than least level -> ELECTION_ADMIN
    const isLeastLevel = !emp.position || emp.position.level >= maxLevel;
    const targetRoleName = isLeastLevel ? SystemRole.EMPLOYEE : SystemRole.ELECTION_ADMIN;

    // 4. Fetch Role entities
    const targetRole = await this.roleRepo.findOne({ where: { name: targetRoleName } });
    const employeeRole = await this.roleRepo.findOne({ where: { name: SystemRole.EMPLOYEE } });
    if (!targetRole) return;

    const targetOrgUnitId = emp.organizationalUnitId ?? null;

    // 5. Fetch existing scopes
    const existingScopes = await this.scopeRepo.find({
      where: { userId: account.id },
      relations: ['role'],
    });

    // Remove old EMPLOYEE and ELECTION_ADMIN scopes so we can re-assign the exact new ones
    // Note: SYSTEM_ADMIN or AUDITOR scopes are preserved
    const scopesToRemove = existingScopes.filter(
      (s) => s.role?.name === SystemRole.ELECTION_ADMIN || s.role?.name === SystemRole.EMPLOYEE,
    );
    if (scopesToRemove.length > 0) {
      await this.scopeRepo.remove(scopesToRemove);
    }

    // 6. Assign role and unit scope
    const newScopes: UserRoleScope[] = [];

    // Target role (ELECTION_ADMIN or EMPLOYEE) scoped to employee's organizational unit
    newScopes.push(
      this.scopeRepo.create({
        userId: account.id,
        roleId: targetRole.id,
        orgUnitId: targetOrgUnitId,
        grantedBy,
      }),
    );

    // If target role is ELECTION_ADMIN, also ensure they have EMPLOYEE role scoped to their unit so they can cast votes
    if (targetRoleName === SystemRole.ELECTION_ADMIN && employeeRole) {
      newScopes.push(
        this.scopeRepo.create({
          userId: account.id,
          roleId: employeeRole.id,
          orgUnitId: targetOrgUnitId,
          grantedBy,
        }),
      );
    }

    await this.scopeRepo.save(newScopes);
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const existingEmail = await this.repo.findOne({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException(`An employee with email "${dto.email}" already exists`);
    }
    const existingId = await this.repo.findOne({ where: { employeeId: dto.employeeId } });
    if (existingId) {
      throw new ConflictException(`Employee ID "${dto.employeeId}" is already in use`);
    }

    // Verify organizational unit exists
    const unit = await this.unitRepo.findOne({ where: { id: dto.organizationalUnitId } });
    if (!unit) {
      throw new NotFoundException(`Organizational unit ${dto.organizationalUnitId} not found`);
    }

    let position: Position | null = null;
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
    const saved: Employee = await this.repo.save(employee);

    // Automatically provision account and assign role & unit scope
    await this.syncRoleAndScopeForEmployee(saved.id);

    return this.findOne(saved.id);
  }

  async findAll(filters?: {
    unitId?: string;
    status?: EmployeeStatus;
    positionId?: string;
    search?: string;
  }): Promise<Employee[]> {
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
      qb.andWhere(
        '(LOWER(employee.firstName) LIKE :search OR LOWER(employee.lastName) LIKE :search OR LOWER(employee.email) LIKE :search OR LOWER(employee.employeeId) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    return qb
      .orderBy('employee.lastName', 'ASC')
      .addOrderBy('employee.firstName', 'ASC')
      .getMany();
  }

  /**
   * Find all employees whose organizationalUnitId is in the provided list.
   * Used by the eligibility engine to find employees in a unit + its descendants.
   */
  async findByUnitIds(unitIds: string[], status?: EmployeeStatus): Promise<Employee[]> {
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

  async findOne(id: string): Promise<Employee> {
    const emp = await this.repo.findOne({
      where: { id },
      relations: ['organizationalUnit', 'position'],
    });
    if (!emp) throw new NotFoundException(`Employee ${id} not found`);
    return emp;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.repo.findOne({ where: { email }, relations: ['organizationalUnit', 'position'] });
  }

  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    return this.repo.findOne({ where: { employeeId }, relations: ['organizationalUnit', 'position'] });
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const emp = await this.findOne(id);

    if (dto.email && dto.email !== emp.email) {
      const conflict = await this.repo.findOne({ where: { email: dto.email } });
      if (conflict) throw new ConflictException(`Email "${dto.email}" is already in use`);
    }

    // Update Unit Placement (explicitly load and set entity relation to avoid TypeORM persistence overwrite)
    if (dto.organizationalUnitId !== undefined) {
      const unit = await this.unitRepo.findOne({ where: { id: dto.organizationalUnitId } });
      if (!unit) throw new NotFoundException(`Organizational unit ${dto.organizationalUnitId} not found`);
      emp.organizationalUnitId = dto.organizationalUnitId;
      emp.organizationalUnit = unit;
    }

    // Update Position (explicitly load and set entity relation or clear it)
    if (dto.positionId !== undefined) {
      if (dto.positionId) {
        const pos = await this.positionRepo.findOne({ where: { id: dto.positionId } });
        if (!pos) throw new NotFoundException(`Position ${dto.positionId} not found`);
        emp.positionId = dto.positionId;
        emp.position = pos;
      } else {
        emp.positionId = null as any;
        emp.position = null as any;
      }
    }

    if (dto.firstName !== undefined) emp.firstName = dto.firstName;
    if (dto.lastName !== undefined) emp.lastName = dto.lastName;
    if (dto.email !== undefined) emp.email = dto.email;
    if (dto.phone !== undefined) emp.phone = dto.phone;
    if (dto.status !== undefined) emp.status = dto.status;
    if (dto.hiredAt !== undefined) emp.hiredAt = dto.hiredAt ? new Date(dto.hiredAt) : emp.hiredAt;
    if (dto.profileImageUrl !== undefined) emp.profileImageUrl = dto.profileImageUrl;

    await this.repo.save(emp);

    // Re-sync role and unit scope automatically whenever details change
    await this.syncRoleAndScopeForEmployee(emp.id);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const emp = await this.findOne(id);
    await this.repo.remove(emp);
  }
}
