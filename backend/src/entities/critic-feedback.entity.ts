import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { OptimizationStrategy } from './optimization-strategy.entity';
import { MonitoringQuery } from './monitoring-query.entity';

/**
 * Critic 评估器反馈表
 * 存储 Critic 模型对策略效果的预测与实际结果的对比
 * 用于训练和改进 Critic 模型的预测准确性
 * 支持策略优化过程中的反馈学习
 */
@Entity('critic_feedback')
@Index('idx_critic_strategy', ['strategyId'])
@Index('idx_critic_error', ['predictionError'])
export class CriticFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'strategy_id', type: 'uuid', comment: '关联的策略ID' })
  strategyId: string;

  @Column({ name: 'query_id', type: 'uuid', comment: '关联的监测查询ID' })
  queryId: string;

  @Column({ name: 'predicted_score', type: 'float', nullable: true, comment: '预测分数' })
  predictedScore: number;

  @Column({ name: 'actual_score', type: 'float', nullable: true, comment: '实际分数' })
  actualScore: number;

  @Column({ name: 'fitness_score', type: 'float', default: 0.0, comment: '适应度分数' })
  fitnessScore: number;

  @Column({ name: 'prediction_error', type: 'float', nullable: true, comment: '预测误差（预测值与实际值的差）' })
  predictionError: number;

  @Column({ type: 'text', nullable: true, comment: '特征数据（JSON格式）' })
  features: string;

  @Column({ name: 'feedback_text', type: 'text', nullable: true, comment: '反馈文本说明' })
  feedbackText: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @ManyToOne(() => OptimizationStrategy, (strategy) => strategy.criticFeedbacks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'strategy_id' })
  strategy: OptimizationStrategy;

  @ManyToOne(() => MonitoringQuery, (query) => query.criticFeedbacks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'query_id' })
  query: MonitoringQuery;
}
