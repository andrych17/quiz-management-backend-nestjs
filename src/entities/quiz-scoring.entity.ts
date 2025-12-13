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

@Entity('quiz_scoring')
@Index(['quizId'])
export class QuizScoring {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quizId: number;

  @Column({ type: 'int', default: 0 })
  correctAnswers: number; // Jumlah jawaban benar

  @Column({ type: 'int', default: 1 })
  points: number; // Point per jawaban (default 1, score dihitung sebagai correctAnswers × points)

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Quiz, (quiz) => quiz.scoringTemplates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;
}
