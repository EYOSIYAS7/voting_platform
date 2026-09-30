import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Election } from './election.entity.js';
import { Employee } from '../../employee/employee.entity.js';

/**
 * Pre-computed table of eligible voters per election.
 *
 * Populated by ElectionService.computeEligibleVoters().
 * Provides O(1) eligibility lookups at vote-cast time instead of
 * re-evaluating all rules on every request.
 */
@Entity('election_voters')
@Unique(['electionId', 'employeeId'])
@Index(['electionId'])
@Index(['employeeId'])
export class ElectionVoter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  electionId: string;

  @ManyToOne(() => Election, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'electionId' })
  election: Election;

  @Column({ type: 'varchar' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  /** True = passes all eligibility rules; False = explicitly ineligible */
  @Column({ default: true })
  isEligible: boolean;

  /** Populated once the employee casts their on-chain vote */
  @Column({ type: 'varchar', nullable: true })
  txHash: string | null;

  /** Whether this employee has already voted */
  @Column({ default: false })
  hasVoted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  votedAt: Date | null;

  @CreateDateColumn()
  checkedAt: Date;
}
