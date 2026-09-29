import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrganizationalUnit } from './organizational-unit.entity.js';
import {
  CreateOrganizationalUnitDto,
  UpdateOrganizationalUnitDto,
} from './dto/organizational-unit.dto.js';

@Injectable()
export class OrganizationalUnitService {
  constructor(
    @InjectRepository(OrganizationalUnit)
    private readonly repo: Repository<OrganizationalUnit>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrganizationalUnitDto): Promise<OrganizationalUnit> {
    if (dto.parentId) {
      const parent = await this.repo.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException(`Parent unit ${dto.parentId} not found`);
      if (parent.organizationId !== dto.organizationId) {
        throw new BadRequestException('Parent unit belongs to a different organization');
      }
    }
    const unit = this.repo.create(dto);
    return this.repo.save(unit);
  }

  async findAll(organizationId: string): Promise<OrganizationalUnit[]> {
    return this.repo.find({
      where: { organizationId },
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<OrganizationalUnit> {
    const unit = await this.repo.findOne({
      where: { id },
      relations: ['parent', 'children', 'organization'],
    });
    if (!unit) throw new NotFoundException(`Organizational unit ${id} not found`);
    return unit;
  }

  /**
   * Returns a flat list of all descendant unit IDs for a given unit,
   * including the unit itself.
   * Uses a recursive CTE for efficiency regardless of hierarchy depth.
   */
  async getDescendantIds(unitId: string): Promise<string[]> {
    const rows: { id: string }[] = await this.dataSource.query(
      `
      WITH RECURSIVE descendants AS (
        SELECT id FROM organizational_units WHERE id = $1
        UNION ALL
        SELECT u.id FROM organizational_units u
        INNER JOIN descendants d ON u."parentId" = d.id
      )
      SELECT id FROM descendants
      `,
      [unitId],
    );
    return rows.map((r) => r.id);
  }

  /**
   * Returns the full ancestor chain (breadcrumb) for a given unit.
   */
  async getAncestors(unitId: string): Promise<OrganizationalUnit[]> {
    const rows: { id: string }[] = await this.dataSource.query(
      `
      WITH RECURSIVE ancestors AS (
        SELECT id, "parentId", name, "unitType" FROM organizational_units WHERE id = $1
        UNION ALL
        SELECT u.id, u."parentId", u.name, u."unitType"
        FROM organizational_units u
        INNER JOIN ancestors a ON u.id = a."parentId"
      )
      SELECT id FROM ancestors
      `,
      [unitId],
    );
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return [];
    return this.repo
      .createQueryBuilder('unit')
      .where('unit.id IN (:...ids)', { ids })
      .getMany();
  }

  async update(id: string, dto: UpdateOrganizationalUnitDto): Promise<OrganizationalUnit> {
    const unit = await this.findOne(id);

    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('A unit cannot be its own parent');
    }

    // Prevent circular references: new parent must not be a descendant
    if (dto.parentId) {
      const descendants = await this.getDescendantIds(id);
      if (descendants.includes(dto.parentId)) {
        throw new BadRequestException('Cannot set a descendant unit as parent (circular hierarchy)');
      }
    }

    Object.assign(unit, dto);
    return this.repo.save(unit);
  }

  async remove(id: string): Promise<void> {
    const unit = await this.findOne(id);
    const children = await this.repo.find({ where: { parentId: id } });
    if (children.length > 0) {
      throw new BadRequestException(
        'Cannot delete a unit that has child units. Reassign or delete children first.',
      );
    }
    await this.repo.remove(unit);
  }

  /**
   * Build a nested tree structure for a given organization.
   */
  async getTree(organizationId: string): Promise<OrganizationalUnit[]> {
    const all = await this.repo.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });

    const map = new Map<string, OrganizationalUnit & { children: OrganizationalUnit[] }>();
    all.forEach((u) => map.set(u.id, { ...u, children: [] }));

    const roots: (OrganizationalUnit & { children: OrganizationalUnit[] })[] = [];
    map.forEach((unit) => {
      if (unit.parentId && map.has(unit.parentId)) {
        map.get(unit.parentId)!.children.push(unit);
      } else {
        roots.push(unit);
      }
    });

    return roots;
  }
}
