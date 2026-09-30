import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Election } from './election.entity.js';

/**
 * EligibilityRule defines who is allowed to participate in an election.
 *
 * Multiple rules per election are OR-ed together at evaluation time.
 * i.e. an employee is eligible if they match ANY one rule.
 */
@Entity('eligibility_rules')
export class EligibilityRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  electionId: string;

  @ManyToOne(() => Election, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'electionId' })
  election: Election;

  /**
   * The organizational unit ID whose subtree (inclusive) is allowed.
   * Null = no unit restriction for this rule.
   */
  @Column({ type: 'varchar', nullable: true })
  unitId: string | null;

  /**
   * Whether to include all recursive descendant units of unitId.
   * Ignored when unitId is null.
   */
  @Column({ default: true })
  includeDescendants: boolean;

  /**
   * JSON array of position IDs allowed.
   * Null = no position restriction for this rule.
   * Example: ["uuid1", "uuid2"]
   */
  @Column({ type: 'simple-json', nullable: true })
  allowedPositionIds: string[] | null;

  /**
   * Minimum tenure in full months an employee must have served.
   * 0 = no minimum.
   */
  @Column({ default: 0 })
  minTenureMonths: number;

  /**
   * Required employee status (ACTIVE | INACTIVE | any).
   * 'ANY' means no status filter applied.
   */
  @Column({ type: 'varchar', default: 'ACTIVE' })
  requiredStatus: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
