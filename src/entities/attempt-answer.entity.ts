import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Attempt } from './attempt.entity';
import { Question } from './question.entity';

@Entity('attempt_answers')
@Index(['attemptId', 'questionId'])
export class AttemptAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  attemptId: string;

  @Column()
  questionId: string;

  @Column('text')
  answerText: string;

  @Column({ type: 'int', nullable: true })
  selectedOption: number; // For single multiple choice answers

  @Column('json', { nullable: true })
  selectedOptions: number[]; // For multiple select answers

  // Relations
  @ManyToOne(() => Attempt, (attempt) => attempt.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptId' })
  attempt: Attempt;

  @ManyToOne(() => Question, (question) => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;
}