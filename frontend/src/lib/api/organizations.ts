import { api } from './client';
import {
  Organization,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationalUnit,
  CreateOrganizationalUnitDto,
  UpdateOrganizationalUnitDto,
  Position,
  CreatePositionDto,
  UpdatePositionDto,
} from '../types/api';

export const organizationsApi = {
  // ── Organizations ─────────────────────────────────────────────────────────

  getOrganizations(): Promise<Organization[]> {
    return api.get<Organization[]>('/organizations');
  },

  getOrganization(id: string): Promise<Organization> {
    return api.get<Organization>(`/organizations/${id}`);
  },

  createOrganization(dto: CreateOrganizationDto): Promise<Organization> {
    return api.post<Organization>('/organizations', dto);
  },

  updateOrganization(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    return api.patch<Organization>(`/organizations/${id}`, dto);
  },

  deleteOrganization(id: string): Promise<void> {
    return api.delete<void>(`/organizations/${id}`);
  },

  // ── Organizational Units ──────────────────────────────────────────────────

  getOrgUnits(organizationId: string): Promise<OrganizationalUnit[]> {
    return api.get<OrganizationalUnit[]>('/organizational-units', {
      params: { organizationId },
    });
  },

  getOrgUnitsTree(organizationId: string): Promise<OrganizationalUnit[]> {
    return api.get<OrganizationalUnit[]>('/organizational-units/tree', {
      params: { organizationId },
    });
  },

  getOrgUnit(id: string): Promise<OrganizationalUnit> {
    return api.get<OrganizationalUnit>(`/organizational-units/${id}`);
  },

  createOrgUnit(dto: CreateOrganizationalUnitDto): Promise<OrganizationalUnit> {
    return api.post<OrganizationalUnit>('/organizational-units', dto);
  },

  updateOrgUnit(id: string, dto: UpdateOrganizationalUnitDto): Promise<OrganizationalUnit> {
    return api.patch<OrganizationalUnit>(`/organizational-units/${id}`, dto);
  },

  deleteOrgUnit(id: string): Promise<void> {
    return api.delete<void>(`/organizational-units/${id}`);
  },

  // ── Positions ─────────────────────────────────────────────────────────────

  getPositions(): Promise<Position[]> {
    return api.get<Position[]>('/positions');
  },

  getPosition(id: string): Promise<Position> {
    return api.get<Position>(`/positions/${id}`);
  },

  createPosition(dto: CreatePositionDto): Promise<Position> {
    return api.post<Position>('/positions', dto);
  },

  updatePosition(id: string, dto: UpdatePositionDto): Promise<Position> {
    return api.patch<Position>(`/positions/${id}`, dto);
  },

  deletePosition(id: string): Promise<void> {
    return api.delete<void>(`/positions/${id}`);
  },
};

