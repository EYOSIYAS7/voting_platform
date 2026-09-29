import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity.js';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto.js';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly repo: Repository<Organization>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Organization with name "${dto.name}" already exists`);
    }
    const org = this.repo.create(dto);
    return this.repo.save(org);
  }

  async findAll(): Promise<Organization[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Organization> {
    const org = await this.repo.findOne({ where: { id }, relations: [] });
    if (!org) throw new NotFoundException(`Organization ${id} not found`);
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.findOne(id);
    Object.assign(org, dto);
    return this.repo.save(org);
  }

  async remove(id: string): Promise<void> {
    const org = await this.findOne(id);
    await this.repo.remove(org);
  }
}
