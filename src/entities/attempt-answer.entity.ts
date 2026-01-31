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
import { Attempt } from './attempt.entity';
import { Question } from './question.entity';

@Entity('attempt_answers')
@Index(['attemptId', 'questionId'], { unique: true })
export class AttemptAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  attemptId: number;

  @Column()
  questionId: number;

  @Column({ type: 'text' })
  answerText: string;

  @Column({ nullable: true })
  isCorrect: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Attempt, (attempt) => attempt.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attemptId' })
  attempt: Attempt;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;
}
