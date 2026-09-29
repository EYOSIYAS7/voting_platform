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
  }): Promise<Employee[]> {
    const where: FindManyOptions<Employee>['where'] = {};
    if (filters?.unitId)     Object.assign(where, { organizationalUnitId: filters.unitId });
    if (filters?.status)     Object.assign(where, { status: filters.status });
    if (filters?.positionId) Object.assign(where, { positionId: filters.positionId });

    return this.repo.find({
      where,
      relations: ['organizationalUnit', 'position'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
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
