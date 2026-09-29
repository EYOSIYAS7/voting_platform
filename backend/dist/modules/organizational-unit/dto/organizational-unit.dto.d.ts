import { UnitType } from '../organizational-unit.entity.js';
export declare class CreateOrganizationalUnitDto {
    organizationId: string;
    parentId?: string;
    name: string;
    description?: string;
    unitType: UnitType;
    headEmployeeId?: string;
}
export declare class UpdateOrganizationalUnitDto {
    name?: string;
    description?: string;
    unitType?: UnitType;
    parentId?: string;
    headEmployeeId?: string;
    status?: string;
}
