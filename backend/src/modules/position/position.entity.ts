import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  /**
   * Hierarchical level for display/ordering only.
   * Does NOT grant system permissions.
   * Lower number = higher in org chart (e.g. 1 = General Director).
   */
  @Column({ default: 99 })
  level: number;

  @Column({ default: true })
  isActive: boolean;

  // NOTE: No @OneToMany to Employee here — avoids circular ESM dependency.
  // Query employees by positionId column directly when needed.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
