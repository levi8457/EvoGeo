import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { GeneratedContent } from './generated-content.entity';

/**
 * 合规检测记录表
 * 存储对生成内容的合规性检测结果
 * 包括风险等级、问题列表、改进建议等
 * 确保生成内容符合法律法规和平台规范
 */
@Entity('compliance_checks')
@Index('idx_compliance_content', ['contentId'])
@Index('idx_compliance_risk', ['riskLevel'])
export class ComplianceCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_id', type: 'uuid', comment: '关联的生成内容ID' })
  contentId: string;

  @Column({ name: 'check_type', length: 50, comment: '检测类型（legal/platform/brand等）' })
  checkType: string;

  @Column({ name: 'is_compliant', type: 'boolean', default: true, comment: '是否合规' })
  isCompliant: boolean;

  @Column({ name: 'risk_level', length: 20, nullable: true, comment: '风险等级（low/medium/high/critical）' })
  riskLevel: string;

  @Column({ type: 'text', nullable: true, comment: '检测发现的问题列表（JSON格式）' })
  issues: string;

  @Column({ type: 'text', nullable: true, comment: '改进建议' })
  suggestions: string;

  @CreateDateColumn({ name: 'checked_at', comment: '检测时间' })
  checkedAt: Date;

  @ManyToOne(() => GeneratedContent, (content) => content.complianceChecks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_id' })
  content: GeneratedContent;
}
