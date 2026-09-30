import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Employee } from '../../employee/employee.entity.js';

export enum WalletBindingStatus {
  PENDING  = 'PENDING',   // challenge issued, not yet verified
  VERIFIED = 'VERIFIED',  // employee proved ownership via SIWE
  REVOKED  = 'REVOKED',   // admin revoked binding
}

/**
 * Links a blockchain wallet address to an employee.
 * An employee may have at most ONE active (VERIFIED) binding at a time.
 * Old bindings are kept for audit trail.
 */
@Entity('wallet_bindings')
@Index(['walletAddress'], { unique: false }) // same address can't bind to 2 employees simultaneously → enforced in service
export class WalletBinding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  /** EIP-55 checksummed Ethereum address */
  @Column()
  walletAddress: string;

  @Column({
    type: 'enum',
    enum: WalletBindingStatus,
    default: WalletBindingStatus.PENDING,
  })
  status: WalletBindingStatus;

  /** Nonce issued to be signed (SIWE challenge) */
  @Column({ type: 'text', nullable: true })
  challenge: string | null;

  /** When the challenge was issued (expires after 5 min) */
  @Column({ type: 'timestamp', nullable: true })
  challengeIssuedAt: Date | null;

  /** When ownership was verified */
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
