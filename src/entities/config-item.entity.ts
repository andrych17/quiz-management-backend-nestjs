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
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ default: true, nullable: true })
  isDisplayToUser: boolean; // Only used for 'services' group - whether this service is displayed in public quiz form dropdown

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
