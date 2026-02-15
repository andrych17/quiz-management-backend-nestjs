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

export enum ScoringType {
  STANDARD = 'standard',
  IQ_SCORING = 'iq_scoring',
}

export enum IQCategory {
  GIFTED = 'Gifted',
  SUPERIOR = 'Superior',
  HIGH_AVERAGE = 'High Average',
  AVERAGE = 'Average',
  LOW_AVERAGE = 'Low Average',
  BORDERLINE = 'Borderline',
}

@Entity('quiz_scoring')
@Index(['quizId'])
export class QuizScoring {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quizId: number;

  @Column({ nullable: true })
  scoringName: string; // Nama template scoring (A, B, C, dll atau deskripsi lain)

  @Column({
    type: 'enum',
    enum: ScoringType,
    enumName: 'scoring_type_enum',
    default: ScoringType.STANDARD,
  })
  scoringType: ScoringType; // STANDARD = scoring biasa, IQ_SCORING = scoring berbasis IQ

  @Column({ nullable: true })
  category: string; // IQ Category hasil dari scoring (Borderline, Average, Superior, dll)

  @Column({ type: 'int', default: 0 })
  correctAnswers: number; // Jumlah jawaban benar untuk mapping ini

  @Column({ type: 'int', default: 0 })
  points: number; // Skor akhir untuk jumlah jawaban benar tersebut (untuk IQ test: 70, 73, 74, dll)

  @Column({ type: 'int', nullable: true })
  correctAnswerPoints: number; // Alias untuk points (untuk backward compatibility)

  @Column({ type: 'int', default: 0 })
  incorrectAnswerPenalty: number; // Penalty untuk jawaban salah

  @Column({ type: 'int', default: 0 })
  unansweredPenalty: number; // Penalty untuk tidak menjawab

  @Column({ type: 'int', default: 0 })
  bonusPoints: number; // Bonus points

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  multiplier: number; // Score multiplier

  @Column({ type: 'boolean', default: false })
  timeBonusEnabled: boolean; // Enable time bonus

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  timeBonusPerSecond: number; // Bonus per detik

  @Column({ type: 'int', nullable: true })
  maxScore: number; // Maksimum nilai (optional, untuk range scoring)

  @Column({ type: 'int', nullable: true })
  minScore: number; // Minimum nilai (optional, untuk range scoring)

  @Column({ type: 'int', nullable: true })
  passingScore: number; // Passing score (optional)

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
