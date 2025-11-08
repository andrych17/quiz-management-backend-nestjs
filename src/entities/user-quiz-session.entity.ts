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
import { User } from './user.entity';

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}

@Entity('user_quiz_sessions')
@Index(['userId', 'quizId'], { unique: true }) // One active session per user per quiz
@Index(['sessionStatus'])
@Index(['expiresAt'])
export class UserQuizSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  quizId: number;

  @Column({ unique: true })
  sessionToken: string; // Unique token for this session

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE
  })
  sessionStatus: SessionStatus;

  @Column({ type: 'timestamp' })
  startedAt: Date; // When user first started the quiz

  @Column({ type: 'timestamp', nullable: true })
  pausedAt: Date; // When user paused (if applicable)

  @Column({ type: 'timestamp', nullable: true })
  resumedAt: Date; // When user resumed (if applicable)

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date; // When user completed the quiz

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // When the session expires (startedAt + quiz duration)

  @Column({ type: 'int', default: 0 })
  timeSpentSeconds: number; // Total time spent (excluding paused time)

  @Column({ type: 'int', nullable: true })
  remainingSeconds: number; // Remaining time in seconds

  @Column({ type: 'json', nullable: true })
  metadata: any; // Additional session data (progress, etc.)

  @Column({ nullable: true })
  userEmail: string; // Email of the user taking the quiz

  @Column({ nullable: true })
  userIdentifier: string; // NIJ or other identifier

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  // Computed properties
  get isExpired(): boolean {
    return this.expiresAt && new Date() > this.expiresAt;
  }

  get isActive(): boolean {
    return this.sessionStatus === SessionStatus.ACTIVE && !this.isExpired;
  }

  get totalElapsedSeconds(): number {
    if (!this.startedAt) return 0;
    
    const now = new Date();
    const start = new Date(this.startedAt);
    
    if (this.completedAt) {
      return Math.floor((new Date(this.completedAt).getTime() - start.getTime()) / 1000);
    }
    
    if (this.sessionStatus === SessionStatus.PAUSED && this.pausedAt) {
      return Math.floor((new Date(this.pausedAt).getTime() - start.getTime()) / 1000);
    }
    
    return Math.floor((now.getTime() - start.getTime()) / 1000);
  }
}