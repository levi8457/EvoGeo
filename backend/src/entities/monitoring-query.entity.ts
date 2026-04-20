import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Brand } from './brand.entity';
import { VisibilityRecord } from './visibility-record.entity';
import { CriticFeedback } from './critic-feedback.entity';

/**
 * 监测查询表
 * 存储需要监测的搜索查询/问题，用于追踪品牌在 AI 回答中的可见性
 * 每个查询属于一个品牌，可以有多个可见性记录
 */
@Entity('monitoring_queries')
@Index('idx_monitoring_queries_brand', ['brandId'])
@Index('idx_monitoring_queries_active', ['isActive'])
export class MonitoringQuery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_id', type: 'uuid', comment: '所属品牌ID' })
  brandId: string;

  @Column({ name: 'query_text', type: 'text', comment: '查询文本/问题内容' })
  queryText: string;

  @Column({ length: 50, nullable: true, comment: '查询分类' })
  category: string;

  @Column({ type: 'int', default: 1, comment: '优先级（1-5，数值越高优先级越高）' })
  priority: number;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: '是否启用' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @ManyToOne(() => Brand, (brand) => brand.monitoringQueries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @OneToMany(() => VisibilityRecord, (record) => record.query)
  visibilityRecords: VisibilityRecord[];

  @OneToMany(() => CriticFeedback, (feedback) => feedback.query)
  criticFeedbacks: CriticFeedback[];
}
