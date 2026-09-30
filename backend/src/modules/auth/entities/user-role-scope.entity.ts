import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserAccount } from './user-account.entity.js';
import { Role } from './role.entity.js';

/**
 * Assigns a role to a user, optionally scoped to an organizational unit.
 *
 * Examples:
 *  - { userId, roleId: SYSTEM_ADMIN, orgUnitId: null }      → global admin
 *  - { userId, roleId: ELECTION_ADMIN, orgUnitId: 'uuid' }  → admin scoped to that unit
 *  - { userId, roleId: EMPLOYEE, orgUnitId: null }           → basic employee access
 *  - { userId, roleId: AUDITOR, orgUnitId: null }            → global auditor
 */
@Entity('user_role_scopes')
@Index(['userId', 'roleId', 'orgUnitId'], { unique: true })
export class UserRoleScope {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => UserAccount, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'userId' })
  user: UserAccount;

  @Column({ type: 'varchar' })
  roleId: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  /**
   * When null → role applies globally.
   * When set  → role applies only within that org unit (and its descendants).
   */
  @Column({ type: 'varchar', nullable: true })
  orgUnitId: string | null;

  /** Who granted this role assignment */
  @Column({ type: 'varchar', nullable: true })
  grantedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
