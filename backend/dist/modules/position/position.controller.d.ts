import { PositionService } from './position.service.js';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto.js';
export declare class PositionController {
    private readonly service;
    constructor(service: PositionService);
    create(dto: CreatePositionDto): Promise<import("./position.entity.js").Position>;
    findAll(): Promise<import("./position.entity.js").Position[]>;
    findOne(id: string): Promise<import("./position.entity.js").Position>;
    update(id: string, dto: UpdatePositionDto): Promise<import("./position.entity.js").Position>;
    remove(id: string): Promise<void>;
}
