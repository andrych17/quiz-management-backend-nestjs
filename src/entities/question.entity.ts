import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { AttemptAnswer } from './attempt-answer.entity';

@Entity('questions')
@Index(['quizId', 'order'])
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order: number;

  @Column('text')
  questionText: string;

  @Column({
    type: 'enum',
    enum: ['multiple-choice', 'multiple-select', 'text'],
  })
  questionType: 'multiple-choice' | 'multiple-select' | 'text';

  @Column('json', { nullable: true })
  options: string[];

  @Column()
  correctAnswer: string;

  @Column()
  quizId: string;

  // Relations
  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @OneToMany(() => AttemptAnswer, (answer) => answer.question)
  answers: AttemptAnswer[];
}