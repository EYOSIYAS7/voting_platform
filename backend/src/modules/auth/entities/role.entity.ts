import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SystemRole {
  SYSTEM_ADMIN  = 'SYSTEM_ADMIN',
  ELECTION_ADMIN = 'ELECTION_ADMIN',
  EMPLOYEE      = 'EMPLOYEE',
  AUDITOR       = 'AUDITOR',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SystemRole, unique: true })
  name: SystemRole;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
