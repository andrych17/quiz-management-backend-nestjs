import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Question } from './question.entity';
import { Attempt } from './attempt.entity';

@Entity('attempt_answers')
@Index(['attemptId', 'questionId'])
export class AttemptAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  attemptId: number;

  @Column()
  questionId: number;

  @Column('text')
  answer: string;

  @Column({ default: false })
  isCorrect: boolean;

  // Relations
  @ManyToOne(() => Attempt, 'answers', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptId' })
  attempt: Attempt;

  @ManyToOne(() => Question, (question) => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;
}