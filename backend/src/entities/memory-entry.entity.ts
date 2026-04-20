import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Brand } from './brand.entity';

/**
 * 记忆条目表
 * 存储系统的历史数据和知识
 * 每个记忆条目关联到一个品牌
 */
@Entity('memory_entries')
@Index('idx_memory_brand', ['brandId'])
@Index('idx_memory_type', ['memoryType'])
export class MemoryEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_id', type: 'uuid', comment: '所属品牌ID' })
  brandId: string;

  @Column({ name: 'memory_type', length: 50, comment: '记忆类型' })
  memoryType: string;

  @Column({ name: 'memory_key', length: 255, comment: '记忆键' })
  memoryKey: string;

  @Column({ type: 'text', comment: '记忆内容' })
  content: string;

  @Column({ type: 'text', nullable: true, comment: '记忆元数据（JSON格式）' })
  metadata: string;

  @Column({ name: 'importance', type: 'int', default: 1, comment: '重要性级别（1-5）' })
  importance: number;

  @Column({ name: 'access_count', type: 'int', default: 0, comment: '访问次数' })
  accessCount: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @Column({ name: 'last_accessed_at', type: 'datetime', nullable: true, comment: '最后访问时间' })
  lastAccessedAt: Date;

  @ManyToOne(() => Brand, (brand) => brand.memoryEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;
}
