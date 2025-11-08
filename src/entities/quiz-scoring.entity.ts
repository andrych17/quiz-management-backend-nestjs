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

  @Column({ length: 255 })
  scoringName: string; // Nama template scoring (e.g., "Standard Scoring", "Weighted Scoring")

  @Column({ type: 'int', default: 10 })
  correctAnswerPoints: number; // Point untuk jawaban benar

  @Column({ type: 'int', default: 0 })
  incorrectAnswerPenalty: number; // Pengurangan point untuk jawaban salah

  @Column({ type: 'int', default: 0 })
  unansweredPenalty: number; // Pengurangan point untuk tidak menjawab

  @Column({ type: 'int', default: 0 })
  bonusPoints: number; // Bonus point (misalnya untuk kecepatan)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  multiplier: number; // Multiplier untuk total score

  @Column({ type: 'boolean', default: false })
  timeBonusEnabled: boolean; // Apakah ada bonus waktu

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  timeBonusPerSecond: number; // Bonus point per detik

  @Column({ type: 'int', nullable: true })
  maxScore: number; // Maximum possible score (optional)

  @Column({ type: 'int', nullable: true })
  minScore: number; // Minimum possible score (optional)

  @Column({ type: 'int', nullable: true })
  passingScore: number; // Passing score untuk lulus (optional)

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
  @ManyToOne(() => Quiz, quiz => quiz.scoringTemplates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;
}