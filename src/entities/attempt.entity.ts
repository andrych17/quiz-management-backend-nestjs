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

@Entity('attempts')
@Index(['quizId', 'email'], { unique: true }) // Prevent duplicate attempts from same email per quiz
@Index(['quizId'])
@Index(['email'])
@Index(['nij'])
export class Attempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quizId: number;

  @Column()
  participantName: string; // Nama peserta

  @Column()
  email: string; // Email peserta

  @Column()
  nij: string; // Nomor Induk Jemaat/NIJ

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ default: false })
  passed: boolean; // Apakah lulus berdasarkan passing score

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @OneToMany('AttemptAnswer', 'attempt', {
    cascade: true,
    eager: false,
  })
  answers: any[];
}