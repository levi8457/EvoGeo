import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { MonitoringQuery } from './monitoring-query.entity';
import { VisibilityRecord } from './visibility-record.entity';
import { OptimizationStrategy } from './optimization-strategy.entity';
import { GeneratedContent } from './generated-content.entity';
import { MemoryEntry } from './memory-entry.entity';

/**
 * 品牌主体表
 * 存储品牌的基本信息，是整个系统的核心实体
 * 一个品牌可以有多个监测查询、可见性记录、优化策略等
 */
@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 255, comment: '品牌名称' })
  name: string;

  @Column({ length: 255, nullable: true, comment: '品牌域名' })
  domain: string;

  @Column({ length: 100, nullable: true, comment: '所属行业' })
  industry: string;

  @Column({ type: 'text', nullable: true, comment: '品牌描述' })
  description: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => MonitoringQuery, (query) => query.brand, {
    cascade: true,
  })
  monitoringQueries: MonitoringQuery[];

  @OneToMany(() => VisibilityRecord, (record) => record.brand)
  visibilityRecords: VisibilityRecord[];

  @OneToMany(() => OptimizationStrategy, (strategy) => strategy.brand)
  strategies: OptimizationStrategy[];

  @OneToMany(() => GeneratedContent, (content) => content.brand)
  generatedContents: GeneratedContent[];

  @OneToMany(() => MemoryEntry, (entry) => entry.brand)
  memoryEntries: MemoryEntry[];
}
