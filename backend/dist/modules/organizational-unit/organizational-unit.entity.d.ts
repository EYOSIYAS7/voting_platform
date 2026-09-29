import { Organization } from '../organization/organization.entity.js';
export declare enum UnitType {
    ORGANIZATION = "ORGANIZATION",
    DEPUTY_DIRECTORATE = "DEPUTY_DIRECTORATE",
    DIRECTORATE = "DIRECTORATE",
    DIVISION = "DIVISION",
    DEPARTMENT = "DEPARTMENT",
    TEAM = "TEAM",
    OTHER = "OTHER"
}
export declare class OrganizationalUnit {
    id: string;
    organizationId: string;
    organization: Organization;
    parentId: string | null;
    parent: OrganizationalUnit | null;
    children: OrganizationalUnit[];
    name: string;
    description: string;
    unitType: UnitType;
    headEmployeeId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
