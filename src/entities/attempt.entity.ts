import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { AttemptAnswer } from './attempt-answer.entity';

@Entity('attempts')
@Index(['quizId', 'nij'], { unique: true }) // Prevent duplicate attempts from same NIJ
@Index(['quizId'])
@Index(['submittedAt'])
export class Attempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quizId: string;

  @Column()
  participantName: string;

  @Column()
  nij: string; // NIJ (Nomor Induk Jemaat)

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ default: false })
  passed: boolean;

  @CreateDateColumn()
  submittedAt: Date;

  // Relations
  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @OneToMany(() => AttemptAnswer, (answer) => answer.attempt, {
    cascade: true,
    eager: true,
  })
  answers: AttemptAnswer[];
}