import { OrganizationService } from './organization.service.js';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto.js';
export declare class OrganizationController {
    private readonly service;
    constructor(service: OrganizationService);
    create(dto: CreateOrganizationDto): Promise<import("./organization.entity.js").Organization>;
    findAll(): Promise<import("./organization.entity.js").Organization[]>;
    findOne(id: string): Promise<import("./organization.entity.js").Organization>;
    update(id: string, dto: UpdateOrganizationDto): Promise<import("./organization.entity.js").Organization>;
    remove(id: string): Promise<void>;
}
