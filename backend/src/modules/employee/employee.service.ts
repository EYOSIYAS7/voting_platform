import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Employee, EmployeeStatus } from './employee.entity.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto.js';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<Employee> {
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

    Object.assign(emp, {
      ...dto,
      hiredAt: dto.hiredAt ? new Date(dto.hiredAt) : emp.hiredAt,
    });
    return this.repo.save(emp);
  }

  async remove(id: string): Promise<void> {
    const emp = await this.findOne(id);
    await this.repo.remove(emp);
  }
}
