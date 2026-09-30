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

@Entity('user_accounts')
@Index(['employeeId'], { unique: true })
export class UserAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 1-to-1 with Employee (one account per employee) */
  @Column({ type: 'varchar' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  /** Hashed with bcrypt */
  @Column()
  passwordHash: string;

  /** Temporary password that must be changed on first login */
  @Column({ default: true })
  mustChangePassword: boolean;

  @Column({ default: true })
  isActive: boolean;

  /** Tracks failed login attempts for lockout */
  @Column({ default: 0 })
  failedLoginCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
