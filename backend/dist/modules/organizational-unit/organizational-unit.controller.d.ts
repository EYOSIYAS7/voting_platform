import { OrganizationalUnitService } from './organizational-unit.service.js';
import { CreateOrganizationalUnitDto, UpdateOrganizationalUnitDto } from './dto/organizational-unit.dto.js';
export declare class OrganizationalUnitController {
    private readonly service;
    constructor(service: OrganizationalUnitService);
    create(dto: CreateOrganizationalUnitDto): Promise<import("./organizational-unit.entity.js").OrganizationalUnit>;
    findAll(organizationId: string): Promise<import("./organizational-unit.entity.js").OrganizationalUnit[]>;
    getTree(organizationId: string): Promise<import("./organizational-unit.entity.js").OrganizationalUnit[]>;
    findOne(id: string): Promise<import("./organizational-unit.entity.js").OrganizationalUnit>;
    getDescendants(id: string): Promise<string[]>;
    getAncestors(id: string): Promise<import("./organizational-unit.entity.js").OrganizationalUnit[]>;
    update(id: string, dto: UpdateOrganizationalUnitDto): Promise<import("./organizational-unit.entity.js").OrganizationalUnit>;
    remove(id: string): Promise<void>;
}
