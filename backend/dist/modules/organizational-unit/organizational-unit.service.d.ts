import { Repository, DataSource } from 'typeorm';
import { OrganizationalUnit } from './organizational-unit.entity.js';
import { CreateOrganizationalUnitDto, UpdateOrganizationalUnitDto } from './dto/organizational-unit.dto.js';
export declare class OrganizationalUnitService {
    private readonly repo;
    private readonly dataSource;
    constructor(repo: Repository<OrganizationalUnit>, dataSource: DataSource);
    create(dto: CreateOrganizationalUnitDto): Promise<OrganizationalUnit>;
    findAll(organizationId: string): Promise<OrganizationalUnit[]>;
    findOne(id: string): Promise<OrganizationalUnit>;
    getDescendantIds(unitId: string): Promise<string[]>;
    getAncestors(unitId: string): Promise<OrganizationalUnit[]>;
    update(id: string, dto: UpdateOrganizationalUnitDto): Promise<OrganizationalUnit>;
    remove(id: string): Promise<void>;
    getTree(organizationId: string): Promise<OrganizationalUnit[]>;
}
