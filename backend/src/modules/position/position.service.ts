import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './position.entity.js';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto.js';

@Injectable()
export class PositionService {
  constructor(
    @InjectRepository(Position)
    private readonly repo: Repository<Position>,
  ) {}

  async create(dto: CreatePositionDto): Promise<Position> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Position "${dto.name}" already exists`);
    }
    return this.repo.save(this.repo.create(dto));
  }

  async findAll(): Promise<Position[]> {
    return this.repo.find({ order: { level: 'ASC', name: 'ASC' } });
  }

  async findOne(id: string): Promise<Position> {
    const pos = await this.repo.findOne({ where: { id } });
    if (!pos) throw new NotFoundException(`Position ${id} not found`);
    return pos;
  }

  async update(id: string, dto: UpdatePositionDto): Promise<Position> {
    const pos = await this.findOne(id);
    Object.assign(pos, dto);
    return this.repo.save(pos);
  }

  async remove(id: string): Promise<void> {
    const pos = await this.findOne(id);
    await this.repo.remove(pos);
  }
}
