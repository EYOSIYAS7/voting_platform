import { Repository } from 'typeorm';
import { Organization } from './organization.entity.js';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto.js';
export declare class OrganizationService {
    private readonly repo;
    constructor(repo: Repository<Organization>);
    create(dto: CreateOrganizationDto): Promise<Organization>;
    findAll(): Promise<Organization[]>;
    findOne(id: string): Promise<Organization>;
    update(id: string, dto: UpdateOrganizationDto): Promise<Organization>;
    remove(id: string): Promise<void>;
}
