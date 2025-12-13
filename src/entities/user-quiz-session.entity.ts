import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Quiz } from './quiz.entity';

@Entity('user_quiz_sessions')
@Index(['quizId', 'userEmail'])
@Index(['sessionToken'], { unique: true })
export class UserQuizSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quizId: number;

  @Column({ nullable: true })
  userId: number;

  @Column()
  userEmail: string;

  @Column({ unique: true })
  sessionToken: string;

  @Column({ default: 'active' })
  status: string; // active, paused, completed, expired

  @Column({ type: 'int', default: 0 })
  timeSpentSeconds: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;
}
