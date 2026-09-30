import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organization/organization.entity.js';
// No back-relation from OrganizationalUnit to avoid ESM circular import.
// unitScopeId is stored as a plain varchar and resolved via ElectionService.

export enum ElectionType {
  GENERAL          = 'GENERAL',          // All employees in the organization
  UNIT_SCOPED      = 'UNIT_SCOPED',      // Employees in a specific unit + descendants
  POSITION_SCOPED  = 'POSITION_SCOPED',  // Employees holding specific positions
}

export enum ElectionStatus {
  DRAFT         = 'DRAFT',
  REGISTRATION  = 'REGISTRATION',
  UPCOMING      = 'UPCOMING',
  ACTIVE        = 'ACTIVE',
  ENDED         = 'ENDED',
  CANCELLED     = 'CANCELLED',
}

@Entity('elections')
export class Election {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ElectionType, default: ElectionType.GENERAL })
  electionType: ElectionType;

  @Column({ type: 'enum', enum: ElectionStatus, default: ElectionStatus.DRAFT })
  status: ElectionStatus;

  /** For UNIT_SCOPED elections — the root unit whose entire subtree participates */
  @Column({ type: 'varchar', nullable: true })
  unitScopeId: string | null;

  /** ISO timestamp: when voter registration opens */
  @Column({ type: 'timestamptz', nullable: true })
  registrationDeadline: Date | null;

  /** ISO timestamp: when voting starts */
  @Column({ type: 'timestamptz' })
  startDate: Date;

  /** ISO timestamp: when voting closes */
  @Column({ type: 'timestamptz' })
  endDate: Date;

  /**
   * On-chain election ID (uint256 from VotingPlatform.sol).
   * Stored as varchar because JS BigInt > Number.MAX_SAFE_INTEGER.
   * Null until the election is published to the blockchain.
   */
  @Column({ type: 'varchar', nullable: true })
  onChainElectionId: string | null;

  /** Number of max candidates allowed (0 = unlimited) */
  @Column({ default: 0 })
  maxCandidates: number;

  /** Whether eligible voters have been pre-computed */
  @Column({ default: false })
  votersComputed: boolean;

  /** Employee ID of the creator */
  @Column({ type: 'varchar', nullable: true })
  createdByEmployeeId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
