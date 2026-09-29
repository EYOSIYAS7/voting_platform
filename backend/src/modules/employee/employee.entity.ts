import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationalUnit } from '../organizational-unit/organizational-unit.entity.js';
import { Position } from '../position/position.entity.js';

export enum EmployeeStatus {
  ACTIVE     = 'ACTIVE',
  INACTIVE   = 'INACTIVE',
  PENDING    = 'PENDING',
  TERMINATED = 'TERMINATED',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Internal HR employee ID — unique per organization */
  @Column({ unique: true })
  employeeId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  organizationalUnitId: string;

  @ManyToOne(() => OrganizationalUnit, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'organizationalUnitId' })
  organizationalUnit: OrganizationalUnit;

  @Column({ nullable: true })
  positionId: string;

  @ManyToOne(() => Position, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'positionId' })
  position: Position;

  @Column({ type: 'enum', enum: EmployeeStatus, default: EmployeeStatus.PENDING })
  status: EmployeeStatus;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ nullable: true })
  hiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
