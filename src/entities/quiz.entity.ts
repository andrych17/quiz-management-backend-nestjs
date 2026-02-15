import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';

export enum QuizType {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
}

export enum QuizScoringMode {
  STANDARD = 'standard',
  IQ_TEST = 'iq_test',
}

@Entity('quizzes')
@Index(['token'], { unique: true })
@Index(['slug'])
@Index(['serviceType'])
@Index(['locationKey'])
@Index(['serviceKey'])
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ unique: true })
  token: string;

  @Column({ nullable: true })
  serviceType: string; // Jenis pelayanan - dynamic from config service group (e.g., 'service_management', 'network_management', etc.)

  @Column({
    type: 'enum',
    enum: QuizType,
    enumName: 'quiz_type_enum',
    default: QuizType.SCHEDULED,
  })
  quizType: QuizType; // SCHEDULED = ada jadwal tetap, MANUAL = dimulai manual oleh admin

  @Column({
    type: 'enum',
    enum: QuizScoringMode,
    enumName: 'quiz_scoring_mode_enum',
    default: QuizScoringMode.STANDARD,
  })
  scoringMode: QuizScoringMode; // STANDARD = scoring biasa (0-100), IQ_TEST = scoring IQ dengan kategori

  @Column({ nullable: true })
  locationKey: string; // Store config key directly (e.g., 'jakarta_pusat', 'jakarta_utara')

  @Column({ nullable: true })
  serviceKey: string; // Store config key directly (e.g., 'sm', 'am', 'technical_support')

  @Column({ default: 70 })
  passingScore: number; // Passing score threshold

  @Column({ default: 5 })
  questionsPerPage: number; // Jumlah pertanyaan per halaman

  @Column({ type: 'int', nullable: true })
  durationMinutes: number; // Duration in minutes (null = no time limit)

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startDateTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDateTime: Date;

  @Column({ nullable: true })
  quizLink: string; // Short URL for public sharing (legacy field)

  @Column({ nullable: true })
  normalUrl: string; // Normal URL for quiz access

  @Column({ nullable: true })
  shortUrl: string; // Shortened URL for easy sharing

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany('Question', 'quiz', {
    cascade: true,
    eager: false,
  })
  questions: any[];

  @OneToMany('Attempt', 'quiz', {
    cascade: true,
    eager: false,
  })
  attempts: any[];

  @OneToMany('QuizScoring', 'quiz', {
    cascade: true,
    eager: false,
  })
  scoringTemplates: any[];

  @OneToMany('UserQuizAssignment', 'quiz', {
    cascade: true,
    eager: false,
  })
  userAssignments: any[];
}
