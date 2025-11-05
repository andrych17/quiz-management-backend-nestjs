import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('config_items')
@Index(['group', 'key'], { unique: true })
@Index(['group'])
export class ConfigItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  group: string;

  @Column()
  key: string;

  @Column('text')
  value: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}