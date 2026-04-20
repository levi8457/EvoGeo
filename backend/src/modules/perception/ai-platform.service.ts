import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AiPlatform } from '../../entities/ai-platform.entity';
import { VisibilityRecord } from '../../entities/visibility-record.entity';
import { Brand } from '../../entities/brand.entity';
import { MonitoringQuery } from '../../entities/monitoring-query.entity';

interface PlatformConfig {
  name: string;
  endpoint: string;
  model: string;
  apiKeyEnv: string;
  headers: (apiKey: string) => Record<string, string>;
  buildBody: (query: string, model: string) => any;
  parseResponse: (data: any) => string;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    buildBody: (query, model) => ({
      model,
      messages: [{ role: 'user', content: query }],
    }),
    parseResponse: (data) => data?.choices?.[0]?.message?.content || '',
  },
  chatgpt: {
    name: 'ChatGPT',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    apiKeyEnv: 'OPENAI_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    buildBody: (query, model) => ({
      model,
      messages: [{ role: 'user', content: query }],
    }),
    parseResponse: (data) => data?.choices?.[0]?.message?.content || '',
  },
  kimi: {
    name: 'Kimi',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
    apiKeyEnv: 'KIMI_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    buildBody: (query, model) => ({
      model,
      messages: [{ role: 'user', content: query }],
    }),
    parseResponse: (data) => data?.choices?.[0]?.message?.content || '',
  },
  tongyi: {
    name: '通义千问',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwen-max',
    apiKeyEnv: 'TONGYI_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    buildBody: (query, model) => ({
      model,
      input: { messages: [{ role: 'user', content: query }] },
    }),
    parseResponse: (data) => data?.output?.text || data?.output?.choices?.[0]?.message?.content || '',
  },
  wenxin: {
    name: '文心一言',
    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    model: 'ernie-4.0-8k',
    apiKeyEnv: 'WENXIN_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    buildBody: (query, model) => ({
      messages: [{ role: 'user', content: query }],
    }),
    parseResponse: (data) => data?.result || '',
  },
  doubao: {
    name: '豆包',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'doubao-pro-32k',
    apiKeyEnv: 'DOUBAO_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    buildBody: (query, model) => ({
      model,
      messages: [{ role: 'user', content: query }],
    }),
    parseResponse: (data) => data?.choices?.[0]?.message?.content || '',
  },
  yuanbao: {
    name: '元宝',
    endpoint: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
    model: 'hunyuan-pro',
    apiKeyEnv: 'YUANBAO_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    buildBody: (query, model) => ({
      model,
      messages: [{ role: 'user', content: query }],
    }),
    parseResponse: (data) => data?.choices?.[0]?.message?.content || '',
  },
};

interface QueryResult {
  platformName: string;
  responseText: string;
  isMentioned: boolean;
  isFirstMention: boolean;
  mentionPosition: number | null;
  responseTimeMs: number;
  error?: string;
}

export type { QueryResult };

@Injectable()
export class AiPlatformService {
  private readonly logger = new Logger(AiPlatformService.name);

  constructor(
    @InjectRepository(AiPlatform)
    private platformRepo: Repository<AiPlatform>,
    @InjectRepository(VisibilityRecord)
    private visibilityRepo: Repository<VisibilityRecord>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async queryPlatform(
    platformName: string,
    queryText: string,
    brandName: string,
    brandId: string,
    queryId: string,
  ): Promise<QueryResult> {
    const platformKey = platformName.toLowerCase();
    const config = PLATFORM_CONFIGS[platformKey];

    if (!config) {
      return {
        platformName,
        responseText: '',
        isMentioned: false,
        isFirstMention: false,
        mentionPosition: null,
        responseTimeMs: 0,
        error: `不支持的AI平台: ${platformName}`,
      };
    }

    const apiKey = this.configService.get<string>(config.apiKeyEnv);
    if (!apiKey) {
      return {
        platformName,
        responseText: '',
        isMentioned: false,
        isFirstMention: false,
        mentionPosition: null,
        responseTimeMs: 0,
        error: `${config.name} API Key 未配置`,
      };
    }

    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          config.endpoint,
          config.buildBody(queryText, config.model),
          { headers: config.headers(apiKey) },
        ),
      );

      const responseTimeMs = Date.now() - startTime;
      const responseText = config.parseResponse(response.data);

      const result = this.analyzeResponse(responseText, brandName);

      await this.saveVisibilityRecord({
        brandId,
        queryId,
        platformName,
        responseText,
        responseTimeMs,
        ...result,
      });

      return {
        platformName,
        responseText,
        responseTimeMs,
        ...result,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      this.logger.error(`${config.name} API 调用失败: ${error.message}`);

      return {
        platformName,
        responseText: '',
        isMentioned: false,
        isFirstMention: false,
        mentionPosition: null,
        responseTimeMs,
        error: error.message,
      };
    }
  }

  async queryMultiplePlatforms(
    platforms: string[],
    queryText: string,
    brandName: string,
    brandId: string,
    queryId: string,
  ): Promise<QueryResult[]> {
    const results = await Promise.all(
      platforms.map((platform) =>
        this.queryPlatform(platform, queryText, brandName, brandId, queryId),
      ),
    );
    return results;
  }

  private analyzeResponse(responseText: string, brandName: string) {
    const isMentioned = responseText.includes(brandName);
    const brandIndex = responseText.indexOf(brandName);
    const isFirstMention = isMentioned && brandIndex !== -1 && brandIndex < 150;

    return {
      isMentioned,
      isFirstMention,
      mentionPosition: isMentioned ? brandIndex : null,
    };
  }

  private async saveVisibilityRecord(data: {
    brandId: string;
    queryId: string;
    platformName: string;
    responseText: string;
    responseTimeMs: number;
    isMentioned: boolean;
    isFirstMention: boolean;
    mentionPosition: number | null;
  }) {
    let platform = await this.platformRepo.findOne({
      where: { platformName: data.platformName },
    });

    if (!platform) {
      const config = PLATFORM_CONFIGS[data.platformName.toLowerCase()];
      platform = await this.platformRepo.save({
        platformName: data.platformName,
        modelName: config?.model || 'unknown',
        apiEndpoint: config?.endpoint || '',
        isEnabled: true,
      });
    }

    const record = this.visibilityRepo.create({
      brandId: data.brandId,
      queryId: data.queryId,
      platformId: platform.id,
      isMentioned: data.isMentioned,
      isFirstMention: data.isFirstMention,
      mentionPosition: data.mentionPosition,
      answerFullText: data.responseText,
      responseTimeMs: data.responseTimeMs,
      citationSnippet: data.isMentioned ? data.responseText.substring(0, 200) : null,
      citationCount: 0,
      collectedAt: new Date(),
    } as any);
    await this.visibilityRepo.save(record);
  }

  async getEnabledPlatforms(): Promise<AiPlatform[]> {
    return this.platformRepo.find({
      where: { isEnabled: true },
    });
  }

  async testPlatformConnection(platformName: string): Promise<{ success: boolean; message: string }> {
    const platformKey = platformName.toLowerCase();
    const config = PLATFORM_CONFIGS[platformKey];

    if (!config) {
      return { success: false, message: `不支持的AI平台: ${platformName}` };
    }

    const apiKey = this.configService.get<string>(config.apiKeyEnv);
    if (!apiKey) {
      return { success: false, message: `${config.name} API Key 未配置` };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          config.endpoint,
          config.buildBody('你好，请回复"连接成功"', config.model),
          { headers: config.headers(apiKey) },
        ),
      );

      const responseText = config.parseResponse(response.data);
      return { success: true, message: `${config.name} 连接成功: ${responseText.substring(0, 50)}...` };
    } catch (error) {
      return { success: false, message: `${config.name} 连接失败: ${error.message}` };
    }
  }

  getSupportedPlatforms(): string[] {
    return Object.keys(PLATFORM_CONFIGS);
  }
}
