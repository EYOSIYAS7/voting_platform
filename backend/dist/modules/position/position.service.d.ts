import { Repository } from 'typeorm';
import { Position } from './position.entity.js';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto.js';
export declare class PositionService {
    private readonly repo;
    constructor(repo: Repository<Position>);
    create(dto: CreatePositionDto): Promise<Position>;
    findAll(): Promise<Position[]>;
    findOne(id: string): Promise<Position>;
    update(id: string, dto: UpdatePositionDto): Promise<Position>;
    remove(id: string): Promise<void>;
}
