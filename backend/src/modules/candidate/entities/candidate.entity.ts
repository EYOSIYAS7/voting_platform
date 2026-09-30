import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Election } from '../../election/entities/election.entity.js';
import { Employee } from '../../employee/employee.entity.js';

export enum CandidateStatus {
  PENDING   = 'PENDING',    // Submitted, awaiting admin review
  APPROVED  = 'APPROVED',   // Approved — will appear on the ballot
  REJECTED  = 'REJECTED',   // Rejected by admin with reason
  WITHDRAWN = 'WITHDRAWN',  // Candidate withdrew themselves
}

/**
 * Candidate for a specific election.
 * One employee may only have one candidacy per election.
 * Self-nomination (employee nominates themselves) is the default flow;
 * admins may also create candidacies on behalf of employees.
 */
@Entity('candidates')
@Unique(['electionId', 'employeeId'])
@Index(['electionId'])
@Index(['employeeId'])
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  electionId: string;

  // No back-relation on Election to avoid ESM circular import.
  @ManyToOne(() => Election, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'electionId' })
  election: Election;

  @Column({ type: 'varchar' })
  employeeId: string;

  // No back-relation on Employee to avoid ESM circular import.
  @ManyToOne(() => Employee, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  /**
   * Short campaign statement / bio entered during nomination.
   * Max 2000 chars.
   */
  @Column({ type: 'text', nullable: true })
  statement: string | null;

  /** Optional campaign slogan / tagline */
  @Column({ type: 'varchar', nullable: true })
  slogan: string | null;

  /** URL to a candidate-specific campaign image (upload handled elsewhere) */
  @Column({ type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({ type: 'enum', enum: CandidateStatus, default: CandidateStatus.PENDING })
  status: CandidateStatus;

  /** Reason provided by admin when rejecting a candidacy */
  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  /**
   * On-chain candidate index (uint8 from VotingPlatform.sol addCandidate).
   * Null until the candidate is registered on-chain.
   */
  @Column({ type: 'int', nullable: true })
  onChainCandidateIndex: number | null;

  /** Employee ID of whoever submitted the nomination */
  @Column({ type: 'varchar', nullable: true })
  nominatedByEmployeeId: string | null;

  /** Employee ID of the admin who approved/rejected */
  @Column({ type: 'varchar', nullable: true })
  reviewedByEmployeeId: string | null;

  /** When the admin actioned the review */
  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
