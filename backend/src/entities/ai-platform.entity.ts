import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { VisibilityRecord } from './visibility-record.entity';

/**
 * AI 平台配置表
 * 存储各个 AI 平台（如 DeepSeek、ChatGPT、文心一言等）的 API 配置信息
 * 用于调用不同 AI 平台进行品牌可见性监测
 */
@Entity('ai_platforms')
export class AiPlatform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'platform_name', length: 100, comment: '平台名称（唯一标识）' })
  platformName: string;

  @Column({ name: 'api_endpoint', length: 500, nullable: true, comment: 'API 端点地址' })
  apiEndpoint: string;

  @Column({ name: 'api_key_encrypted', type: 'text', nullable: true, comment: '加密后的 API 密钥' })
  apiKeyEncrypted: string;

  @Column({ name: 'model_name', length: 100, nullable: true, comment: '模型名称' })
  modelName: string;

  @Column({
    name: 'rate_limit_per_minute',
    type: 'int',
    default: 10,
    comment: '每分钟请求限制',
  })
  rateLimitPerMinute: number;

  @Column({ name: 'is_enabled', type: 'boolean', default: true, comment: '是否启用' })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @OneToMany(() => VisibilityRecord, (record) => record.platform)
  visibilityRecords: VisibilityRecord[];
}
