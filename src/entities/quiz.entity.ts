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
import { User } from './user.entity';
import { Question } from './question.entity';
import { Attempt } from './attempt.entity';

@Entity('quizzes')
@Index(['linkToken'], { unique: true })
@Index(['slug'])
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ unique: true })
  linkToken: string;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ default: 1 })
  passingScore: number;

  @Column({ default: 5 })
  questionsPerPage: number;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.quizzes)
  @JoinColumn({ name: 'createdBy', referencedColumnName: 'email' })
  creator: User;

  @OneToMany(() => Question, (question) => question.quiz, {
    cascade: true,
    eager: false,
  })
  questions: Question[];

  @OneToMany(() => Attempt, (attempt) => attempt.quiz, {
    cascade: true,
    eager: false,
  })
  attempts: Attempt[];
}