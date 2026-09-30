import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Permissions follow the format: "action:resource"
 * Examples: "read:election", "create:election", "manage:organization"
 */
@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** e.g. "read", "create", "update", "delete", "manage" */
  @Column()
  action: string;

  /** e.g. "election", "organization", "employee", "result", "audit" */
  @Column()
  resource: string;

  @Column({ unique: true })
  name: string; // = `${action}:${resource}`

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
