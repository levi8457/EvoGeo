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
import { MonitoringQuery } from './monitoring-query.entity';
import { AiPlatform } from './ai-platform.entity';

/**
 * 可见性监测记录表
 * 记录每次 AI 平台查询的结果，包括品牌是否被提及、提及位置、引用次数等
 * 这是感知层的核心数据表，用于分析品牌在 AI 回答中的可见性表现
 */
@Entity('visibility_records')
@Index('idx_visibility_brand_query', ['brandId', 'queryId'])
@Index('idx_visibility_platform', ['platformId'])
@Index('idx_visibility_collected_at', ['collectedAt'])
export class VisibilityRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_id', type: 'uuid', comment: '品牌ID' })
  brandId: string;

  @Column({ name: 'query_id', type: 'uuid', comment: '监测查询ID' })
  queryId: string;

  @Column({ name: 'platform_id', type: 'uuid', comment: 'AI平台ID' })
  platformId: string;

  @Column({ name: 'is_mentioned', type: 'boolean', default: false, comment: '品牌是否被提及' })
  isMentioned: boolean;

  @Column({ name: 'mention_position', type: 'int', nullable: true, comment: '提及位置（在回答中的位置）' })
  mentionPosition: number;

  @Column({ name: 'is_first_mention', type: 'boolean', default: false, comment: '是否为首个提及的品牌' })
  isFirstMention: boolean;

  @Column({ name: 'citation_count', type: 'int', default: 0, comment: '引用次数' })
  citationCount: number;

  @Column({ name: 'citation_snippet', type: 'text', nullable: true, comment: '引用片段文本' })
  citationSnippet: string;

  @Column({ name: 'answer_full_text', type: 'text', nullable: true, comment: 'AI 完整回答文本' })
  answerFullText: string;

  @Column({
    name: 'competitor_mentions',
    type: 'text',
    nullable: true,
    comment: '竞品提及信息（JSON格式）',
  })
  competitorMentions: string;

  @CreateDateColumn({ name: 'collected_at', comment: '数据采集时间' })
  collectedAt: Date;

  @Column({ name: 'response_time_ms', type: 'int', nullable: true, comment: 'API 响应时间（毫秒）' })
  responseTimeMs: number;

  @ManyToOne(() => Brand, (brand) => brand.visibilityRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToOne(() => MonitoringQuery, (query) => query.visibilityRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'query_id' })
  query: MonitoringQuery;

  @ManyToOne(() => AiPlatform, (platform) => platform.visibilityRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'platform_id' })
  platform: AiPlatform;
}
