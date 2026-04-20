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
import { CriticFeedback } from './critic-feedback.entity';
import { GeneratedContent } from './generated-content.entity';

/**
 * 优化策略存档表
 * 存储 MAP-Elites 算法进化生成的优化策略
 * 每个策略有适应度分数、代数、成功率等进化指标
 * 用于持续优化品牌在 AI 回答中的可见性
 */
@Entity('optimization_strategies')
@Index('idx_strategies_brand', ['brandId'])
@Index('idx_strategies_fitness', ['fitnessScore'])
@Index('idx_strategies_archive', ['archiveDimension1', 'archiveDimension2'])
export class OptimizationStrategy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_id', type: 'uuid', comment: '所属品牌ID' })
  brandId: string;

  @Column({ name: 'strategy_type', length: 50, comment: '策略类型' })
  strategyType: string;

  @Column({ name: 'content_template', type: 'text', nullable: true, comment: '内容模板' })
  contentTemplate: string;

  @Column({ type: 'text', nullable: true, comment: '策略参数（JSON格式）' })
  parameters: string;

  @Column({ type: 'int', default: 1, comment: '进化代数' })
  generation: number;

  @Column({ name: 'fitness_score', type: 'float', default: 0.0, comment: '适应度分数' })
  fitnessScore: number;

  @Column({ name: 'success_count', type: 'int', default: 0, comment: '成功次数' })
  successCount: number;

  @Column({ name: 'failure_count', type: 'int', default: 0, comment: '失败次数' })
  failureCount: number;

  @Column({ name: 'evaluations', type: 'int', default: 0, comment: '评估次数' })
  evaluations: number;

  @Column({ name: 'parent_strategies', type: 'text', nullable: true, comment: '父策略ID数组' })
  parentStrategies: string;

  @Column({
    name: 'archive_dimension_1',
    length: 100,
    nullable: true,
    comment: 'MAP-Elites 存档维度1',
  })
  archiveDimension1: string;

  @Column({
    name: 'archive_dimension_2',
    length: 100,
    nullable: true,
    comment: 'MAP-Elites 存档维度2',
  })
  archiveDimension2: string;

  @Column({ length: 20, default: 'active', comment: '策略状态（active/inactive/archived）' })
  status: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @Column({ name: 'last_used_at', type: 'datetime', nullable: true, comment: '最后使用时间' })
  lastUsedAt: Date;

  @ManyToOne(() => Brand, (brand) => brand.strategies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @OneToMany(() => CriticFeedback, (feedback) => feedback.strategy)
  criticFeedbacks: CriticFeedback[];

  @OneToMany(() => GeneratedContent, (content) => content.strategy)
  generatedContents: GeneratedContent[];
}
