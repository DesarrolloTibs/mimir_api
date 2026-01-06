import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
  email: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150, nullable: true })
  fullName: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'varchar', length: 50, default: 'Developer' })
  role: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}