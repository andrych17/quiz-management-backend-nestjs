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
import { AttemptAnswer } from './attempt-answer.entity';

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

  @Column({ nullable: true })
  servoNumber: string; // Servo Number peserta saat mengerjakan quiz

  @Column({ nullable: true })
  serviceKey: string; // Service/jenis pelayanan yang dipilih peserta saat mengerjakan quiz

  @Column({ type: 'int', default: 0 })
  score: number; // Nilai akhir (bisa 70, 80, 90 untuk mode IPK, atau 0-100 untuk mode persentase)

  @Column({ length: 10, nullable: true })
  grade: string; // Grade (A, B, C, D, E, F)

  @Column({ type: 'int', default: 0 })
  correctAnswers: number; // Jumlah jawaban benar

  @Column({ type: 'int', default: 0 })
  totalQuestions: number; // Total soal

  @Column({ default: false })
  passed: boolean; // Apakah lulus berdasarkan passing score

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startDateTime: Date; // Waktu mulai pengerjaan (set saat create attempt)

  @Column({ type: 'timestamp', nullable: true })
  endDateTime: Date; // Waktu akhir pengerjaan (calculated from startDateTime + duration)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @OneToMany(() => AttemptAnswer, (answer) => answer.attempt, {
    cascade: true,
    eager: false,
  })
  answers: AttemptAnswer[];
}
