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
import { OptimizationStrategy } from './optimization-strategy.entity';
import { ComplianceCheck } from './compliance-check.entity';

/**
 * 生成内容表
 * 存储基于优化策略生成的内容
 * 每个内容关联到一个品牌和一个策略
 */
@Entity('generated_contents')
@Index('idx_generated_brand', ['brandId'])
@Index('idx_generated_strategy', ['strategyId'])
export class GeneratedContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_id', type: 'uuid', comment: '所属品牌ID' })
  brandId: string;

  @Column({ name: 'strategy_id', type: 'uuid', nullable: true, comment: '使用的优化策略ID' })
  strategyId: string;

  @Column({ name: 'content_type', length: 50, comment: '内容类型' })
  contentType: string;

  @Column({ name: 'content_title', length: 255, nullable: true, comment: '内容标题' })
  contentTitle: string;

  @Column({ type: 'text', comment: '生成的内容' })
  content: string;

  @Column({ type: 'text', nullable: true, comment: '内容参数（JSON格式）' })
  parameters: string;

  @Column({ name: 'platform', length: 50, nullable: true, comment: '目标平台' })
  platform: string;

  @Column({ name: 'status', length: 20, default: 'generated', comment: '内容状态（generated/published/archived）' })
  status: string;

  @Column({ name: 'feedback_score', type: 'float', nullable: true, comment: '反馈评分' })
  feedbackScore: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @Column({ name: 'published_at', type: 'datetime', nullable: true, comment: '发布时间' })
  publishedAt: Date;

  @Column({ name: 'deployment_status', length: 20, default: 'draft', comment: '部署状态（draft/deployed/archived）' })
  deploymentStatus: string;

  @Column({ name: 'deployed_at', type: 'datetime', nullable: true, comment: '部署时间' })
  deployedAt: Date;

  @ManyToOne(() => Brand, (brand) => brand.generatedContents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToOne(() => OptimizationStrategy, (strategy) => strategy.generatedContents, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'strategy_id' })
  strategy: OptimizationStrategy;

  @OneToMany(() => ComplianceCheck, (check) => check.content)
  complianceChecks: ComplianceCheck[];
}
