import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Attempt } from './attempt.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: ['superadmin', 'admin', 'user'],
    default: 'user',
  })
  role: 'superadmin' | 'admin' | 'user';

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ nullable: true })
  locationKey: string; // Store config key directly (e.g., 'jakarta_pusat', 'jakarta_utara')

  @Column({ nullable: true })
  serviceKey: string; // Store config key directly (e.g., 'sm', 'am', 'technical_support')

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany('UserQuizAssignment', 'user')
  quizAssignments: any[];
}