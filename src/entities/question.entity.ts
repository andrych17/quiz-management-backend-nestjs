import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Quiz } from './quiz.entity';

@Entity('questions')
@Index(['quizId', 'order'])
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quizId: number;

  @Column('text')
  questionText: string;

  @Column({
    type: 'enum',
    enum: ['multiple-choice', 'multiple-select', 'text', 'true-false'],
  })
  questionType: 'multiple-choice' | 'multiple-select' | 'text' | 'true-false';

  @Column('jsonb', { nullable: true })
  options: string[];

  @Column()
  correctAnswer: string;

  @Column({ default: 1 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @OneToMany('AttemptAnswer', 'question')
  answers: any[];
}
