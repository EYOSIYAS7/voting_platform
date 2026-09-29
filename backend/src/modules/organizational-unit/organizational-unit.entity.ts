import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Organization entity no longer imports OrganizationalUnit, so this import is safe (no cycle).
import { Organization } from '../organization/organization.entity.js';

export enum UnitType {
  ORGANIZATION       = 'ORGANIZATION',
  DEPUTY_DIRECTORATE = 'DEPUTY_DIRECTORATE',
  DIRECTORATE        = 'DIRECTORATE',
  DIVISION           = 'DIVISION',
  DEPARTMENT         = 'DEPARTMENT',
  TEAM               = 'TEAM',
  OTHER              = 'OTHER',
}

@Entity('organizational_units')
export class OrganizationalUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  // Organization has no back-relation, so we pass undefined for the inverse side.
  @ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  /** Self-referencing FK — null means this unit is a direct child of the org root */
  @Column({ type: 'varchar', nullable: true })
  parentId: string | null;

  // Self-referencing relations are always safe — same file, no cross-import.
  @ManyToOne(() => OrganizationalUnit, (unit) => unit.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: OrganizationalUnit | null;

  @OneToMany(() => OrganizationalUnit, (unit) => unit.parent)
  children: OrganizationalUnit[];

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: UnitType, default: UnitType.OTHER })
  unitType: UnitType;

  /**
   * Employee ID who heads this unit — stored as a plain varchar column.
   * No @ManyToOne relation here to avoid circular import with employee.entity.
   */
  @Column({ type: 'varchar', nullable: true })
  headEmployeeId: string | null;

  @Column({ default: 'ACTIVE' })
  status: string;

  // No @OneToMany to Employee — avoids circular ESM import with employee.entity.
  // Employees are found by querying organizationalUnitId column directly.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
