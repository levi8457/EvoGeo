import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GeneratedContent } from '../../entities/generated-content.entity';
import { OptimizationStrategy } from '../../entities/optimization-strategy.entity';
import { Brand } from '../../entities/brand.entity';

interface PlatformConfig {
  name: string;
  endpoint: string;
  model: string;
  apiKeyEnv: string;
  buildBody: (query: string, model: string, brandName: string, contentType: string) => any;
  parseResponse: (data: any) => string;
}

const CONTENT_TYPE_TEMPLATES: Record<string, { prompt: string; length: string; seoGuidelines: string }> = {
  article: {
    prompt: `请为品牌撰写一篇专业的SEO友好型文章，要求如下：

1. 文章标题：使用包含关键词的吸引人标题，控制在25-30字之间
2. 文章结构：包含引言、正文（至少3个小节）、结语
3. 关键词布局：在标题、首段、小节标题、结尾处自然融入关键词
4. 内容质量：
   - 提供深度、独到的行业见解
   - 使用具体数据或案例支撑观点
   - 内容原创，有独特价值
5. 可读性：段落分明，使用有序列表或无序列表增强结构化
6. 字数要求：800-1000字`,
    length: '800-1000字',
    seoGuidelines: '关键词密度2-3%，包含长尾关键词，使用小标题提升SEO效果',
  },
  social_media: {
    prompt: `请撰写适合社交媒体平台的高质量推广内容：

1. 内容要求：
   - 开头要有吸引力，引发用户兴趣
   - 中间部分突出品牌核心价值和差异化优势
   - 结尾包含明确的行动号召（CTA）
2. 格式：使用emoji增强视觉效果，每段控制在2-3行
3. 关键词：自然融入品牌关键词
4. 字数：100-200字
5. 标签：添加3-5个相关热门话题标签`,
    length: '100-200字',
    seoGuidelines: '使用热门话题标签，包含品牌关键词，提升互动率',
  },
  advertisement: {
    prompt: `请撰写一段专业、有说服力的广告文案：

1. 结构：问题-解决方案-优势-号召
2. 核心要素：
   - 明确的目标用户痛点
   - 品牌的独特价值主张
   - 具体的数据或社会证明
   - 清晰的行动指引
3. 语气：专业且有感染力
4. 字数：50-100字`,
    length: '50-100字',
    seoGuidelines: '突出差异化卖点，使用行动导向语言，提升转化率',
  },
  blog: {
    prompt: `请撰写一篇专业、有深度的博客文章：

1. 文章主题：围绕品牌相关领域的专业知识或行业趋势
2. 结构要求：
   - 吸引人的标题
   - 简要导语（100字内）
   - 正文（3-5个核心观点）
   - 总结与思考
3. 内容深度：
   - 提供独家的专业见解
   - 包含实用的技巧或方法论
   - 引用行业数据或案例
4. SEO优化：在内容中自然融入关键词
5. 字数：600-800字`,
    length: '600-800字',
    seoGuidelines: '建立专业权威性，包含内部链接建议，使用描述性小标题',
  },
  product_description: {
    prompt: `请撰写一段专业、有说服力的产品描述：

1. 内容要素：
   - 产品核心功能和特性
   - 适用场景和目标用户
   - 与竞品的差异化优势
   - 质量认证或用户评价
2. 语言风格：专业、简洁、有说服力
3. 关键词：融入产品核心关键词
4. 字数：200-400字
5. 格式：建议使用bullet points突出关键信息`,
    length: '200-400字',
    seoGuidelines: '产品关键词优化，明确USP，包含搜索意图词汇',
  },
  email: {
    prompt: `请撰写一封专业的品牌推广邮件：

1. 邮件结构：
   - 吸引人的主题行（包含关键词，30字内）
   - 个性化的开场白
   - 产品/服务核心价值介绍
   - 社会证明或案例展示
   - 明确的行动号召
2. 语气：专业、友好、有价值
3. 长度：300-500字
4. 关键词：自然融入品牌关键词`,
    length: '300-500字',
    seoGuidelines: '主题行SEO优化，包含品牌关键词，提升打开率和转化率',
  },
};

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    buildBody: (query, model, brandName, contentType) => ({
      model,
      messages: [
        { role: 'system', content: `你是一位专业的品牌营销顾问，擅长为品牌撰写高质量的营销内容。请根据品牌信息生成专业、有吸引力的内容。品牌名称：${brandName}` },
        { role: 'user', content: query },
      ],
    }),
    parseResponse: (data) => data?.choices?.[0]?.message?.content || '',
  },
  chatgpt: {
    name: 'ChatGPT',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    apiKeyEnv: 'OPENAI_API_KEY',
    buildBody: (query, model, brandName, contentType) => ({
      model,
      messages: [
        { role: 'system', content: `你是一位专业的品牌营销顾问，擅长为品牌撰写高质量的营销内容。请根据品牌信息生成专业、有吸引力的内容。品牌名称：${brandName}` },
        { role: 'user', content: query },
      ],
    }),
    parseResponse: (data) => data?.choices?.[0]?.message?.content || '',
  },
  kimi: {
    name: 'Kimi',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
    apiKeyEnv: 'KIMI_API_KEY',
    buildBody: (query, model, brandName, contentType) => ({
      model,
      messages: [
        { role: 'system', content: `你是一位专业的品牌营销顾问，擅长为品牌撰写高质量的营销内容。请根据品牌信息生成专业、有吸引力的内容。品牌名称：${brandName}` },
        { role: 'user', content: query },
      ],
    }),
    parseResponse: (data) => data?.choices?.[0]?.message?.content || '',
  },
  wenxin: {
    name: '文心一言',
    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    model: 'ernie-4.0-8k',
    apiKeyEnv: 'WENXIN_API_KEY',
    buildBody: (query, model, brandName, contentType) => ({
      messages: [
        { role: 'user', content: `品牌名称：${brandName}\n\n${query}` },
      ],
    }),
    parseResponse: (data) => data?.result || '',
  },
  tongyi: {
    name: '通义千问',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwen-max',
    apiKeyEnv: 'TONGYI_API_KEY',
    buildBody: (query, model, brandName, contentType) => ({
      model,
      input: {
        messages: [
          { role: 'system', content: `你是一位专业的品牌营销顾问，擅长为品牌撰写高质量的营销内容。请根据品牌信息生成专业、有吸引力的内容。品牌名称：${brandName}` },
          { role: 'user', content: query },
        ],
      },
    }),
    parseResponse: (data) => data?.output?.text || data?.output?.choices?.[0]?.message?.content || '',
  },
};

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    @InjectRepository(GeneratedContent)
    private contentRepo: Repository<GeneratedContent>,
    @InjectRepository(OptimizationStrategy)
    private strategyRepo: Repository<OptimizationStrategy>,
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async generateContent(dto: {
    brandId: string;
    strategyId: string;
    contentType: string;
    platform: string;
    parameters?: Record<string, any>;
  }) {
    try {
      const brand = await this.brandRepo.findOne({ where: { id: dto.brandId } });
      if (!brand) {
        throw new NotFoundException('品牌不存在');
      }

      const strategy = await this.strategyRepo.findOne({ where: { id: dto.strategyId } });
      if (!strategy) {
        throw new NotFoundException('策略不存在');
      }

      if (strategy.brandId !== dto.brandId) {
        throw new BadRequestException('策略不属于该品牌');
      }

      const contentTemplate = CONTENT_TYPE_TEMPLATES[dto.contentType] || CONTENT_TYPE_TEMPLATES.article;
      const brandName = brand.name;

      const generatedContent = await this.callAIPlatform(
        dto.platform,
        contentTemplate.prompt,
        brandName,
        dto.contentType,
      );

      const content = this.contentRepo.create({
        brandId: dto.brandId,
        strategyId: dto.strategyId,
        contentType: dto.contentType,
        contentTitle: generatedContent.title,
        content: generatedContent.content,
        parameters: JSON.stringify(dto.parameters || {}),
        platform: dto.platform,
        status: 'generated',
      });

      return await this.contentRepo.save(content);
    } catch (error) {
      this.logger.error('生成内容失败:', error);
      throw error;
    }
  }

  private async callAIPlatform(
    platform: string,
    prompt: string,
    brandName: string,
    contentType: string,
  ): Promise<{ title: string; content: string }> {
    const platformKey = platform.toLowerCase();
    const config = PLATFORM_CONFIGS[platformKey];

    if (!config) {
      return this.generateFallbackContent(brandName, contentType);
    }

    const apiKey = this.configService.get<string>(config.apiKeyEnv);
    if (!apiKey) {
      this.logger.warn(`${config.name} API Key 未配置，使用备用生成`);
      return this.generateFallbackContent(brandName, contentType);
    }

    try {
      const contentTemplate = CONTENT_TYPE_TEMPLATES[contentType] || CONTENT_TYPE_TEMPLATES.article;
      const fullPrompt = `${contentTemplate.prompt}

【SEO优化指导】
${contentTemplate.seoGuidelines}

内容长度要求：${contentTemplate.length}

请生成专业、有吸引力、符合品牌调性、SEO友好的内容。内容应该：
- 包含关键词但不过度堆砌
- 提供独特的价值和见解
- 结构清晰，易于阅读
- 能够吸引目标用户并提升搜索引擎排名`;

      const response = await firstValueFrom(
        this.httpService.post(
          config.endpoint,
          config.buildBody(fullPrompt, config.model, brandName, contentType),
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const responseText = config.parseResponse(response.data);

      if (!responseText) {
        return this.generateFallbackContent(brandName, contentType);
      }

      const title = this.generateTitle(brandName, contentType, responseText);

      return {
        title,
        content: responseText,
      };
    } catch (error) {
      this.logger.error(`${config.name} API 调用失败: ${error.message}`);
      return this.generateFallbackContent(brandName, contentType);
    }
  }

  private generateTitle(brandName: string, contentType: string, content: string): string {
    const prefixMap: Record<string, string> = {
      article: '专业解读',
      social_media: '社交分享',
      advertisement: '精选推荐',
      blog: '深度分析',
      product_description: '产品介绍',
      email: '品牌资讯',
    };

    const prefix = prefixMap[contentType] || '内容推荐';
    return `${prefix} | ${brandName}`;
  }

  private generateFallbackContent(brandName: string, contentType: string): { title: string; content: string } {
    const contentTemplate = CONTENT_TYPE_TEMPLATES[contentType] || CONTENT_TYPE_TEMPLATES.article;

    const fallbackContents: Record<string, string[]> = {
      article: [
        `【${brandName}品牌深度解析】

一、品牌概述
${brandName}作为行业内的知名品牌，一直致力于为用户提供优质的产品和服务。品牌始终坚持创新驱动发展战略，不断提升核心竞争力。

二、核心优势
1. 产品品质卓越：严格把控每一个环节，确保产品质量达到行业领先水平
2. 用户体验至上：深入了解用户需求，提供个性化的解决方案
3. 技术创新引领：持续投入研发，推动行业技术进步

三、市场定位
${brandName}专注于为追求品质生活的用户提供高性价比的产品和服务，在市场中建立了良好的品牌形象。

四、未来展望
品牌将继续秉持"用户至上"理念，不断创新，为用户创造更多价值。`,
      ],
      social_media: [
        `🔥 ${brandName}，您值得拥有的品质之选！

✨ 品质保障，值得信赖
✨ 创新技术，领先行业
✨ 用户至上，服务贴心

立即体验，感受品牌的独特魅力！
#${brandName} #品质生活 #品牌推荐`,
      ],
      advertisement: [
        `【${brandName}】
品质传承，创新驱动
为您的美好生活赋能

立即咨询，开启品质之旅`,
      ],
      blog: [
        `探索${brandName}的成功之道

在竞争激烈的市场环境中，${brandName}凭借其独特的品牌战略脱颖而出。本文将深入分析该品牌的成功密码。

一、精准的市场定位
${brandName}始终坚持以用户需求为导向，通过深入市场调研，准确把握消费者心理，制定精准的市场定位策略。

二、创新的产品策略
品牌不断加大研发投入，推出符合市场需求的新产品，提升产品竞争力。

三、卓越的用户体验
从产品设计到售后服务，${brandName}始终将用户体验放在首位，赢得了广大消费者的信赖。

四、总结
${brandName}的成功源于对品质的坚持和对创新的追求。相信在未来，品牌将继续保持领先地位。`,
      ],
      product_description: [
        `【${brandName}】产品介绍

产品亮点：
✓ 优质材料，品质保障
✓ 先进工艺，精益求精
✓ 人性化设计，操作便捷
✓ 完善的售后服务体系

适用场景：
无论是日常使用还是专业需求，${brandName}都能为您提供满意的解决方案。

立即体验品质之选！`,
      ],
      email: [
        `尊敬的客户：

您好！

感谢您对${brandName}的关注与支持！

我们很高兴向您介绍我们的最新产品/服务。${brandName}始终致力于为您提供高品质的产品和专业的服务。

【产品/服务特色】
• 品质卓越：精选优质材料，匠心工艺
• 技术领先：创新研发，行业领先
• 服务贴心：专业团队，全程支持

如您有任何疑问或需求，请随时与我们联系。

祝好！
${brandName}团队`,
      ],
    };

    const contents = fallbackContents[contentType] || fallbackContents.article;
    const randomContent = contents[Math.floor(Math.random() * contents.length)];
    const title = this.generateTitle(brandName, contentType, randomContent);

    return {
      title,
      content: randomContent,
    };
  }

  async getGeneratedContents(
    brandId?: string,
    contentType?: string,
    platform?: string,
    status?: string,
  ) {
    try {
      const query = this.contentRepo.createQueryBuilder('content');

      if (brandId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(brandId)) {
          query.where('content.brandId = :brandId', { brandId });
        }
      }

      if (contentType) {
        query.andWhere('content.contentType = :contentType', { contentType });
      }

      if (platform) {
        query.andWhere('content.platform = :platform', { platform });
      }

      if (status) {
        query.andWhere('content.status = :status', { status });
      }

      query.orderBy('content.createdAt', 'DESC');

      return await query.getMany();
    } catch (error) {
      this.logger.error('获取生成内容列表失败:', error);
      throw error;
    }
  }

  async getGeneratedContentById(id: string) {
    try {
      const content = await this.contentRepo.findOne({ where: { id } });
      if (!content) {
        throw new NotFoundException('内容不存在');
      }
      return content;
    } catch (error) {
      this.logger.error('获取内容详情失败:', error);
      throw error;
    }
  }

  async updateContentStatus(id: string, status: string) {
    try {
      const content = await this.contentRepo.findOne({ where: { id } });
      if (!content) {
        throw new NotFoundException('内容不存在');
      }

      content.status = status;
      if (status === 'published') {
        content.publishedAt = new Date();
      }

      return await this.contentRepo.save(content);
    } catch (error) {
      this.logger.error('更新内容状态失败:', error);
      throw error;
    }
  }

  async deleteGeneratedContent(id: string) {
    try {
      const content = await this.contentRepo.findOne({ where: { id } });
      if (!content) {
        throw new NotFoundException('内容不存在');
      }

      await this.contentRepo.remove(content);
      return { success: true, message: '内容删除成功' };
    } catch (error) {
      this.logger.error('删除内容失败:', error);
      throw error;
    }
  }

  async getContentStatistics(brandId: string) {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(brandId)) {
        return {
          total: 0,
          byStatus: {},
          byType: {},
          byPlatform: {},
        };
      }

      const total = await this.contentRepo.count({ where: { brandId } });

      const statusResult = await this.contentRepo
        .createQueryBuilder('content')
        .select('content.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('content.brandId = :brandId', { brandId })
        .groupBy('content.status')
        .getRawMany();

      const byStatus: Record<string, number> = {};
      statusResult.forEach(item => {
        byStatus[item.status || 'unknown'] = parseInt(item.count || '0', 10);
      });

      const typeResult = await this.contentRepo
        .createQueryBuilder('content')
        .select('content.contentType', 'contentType')
        .addSelect('COUNT(*)', 'count')
        .where('content.brandId = :brandId', { brandId })
        .groupBy('content.contentType')
        .getRawMany();

      const byType: Record<string, number> = {};
      typeResult.forEach(item => {
        byType[item.contentType || 'unknown'] = parseInt(item.count || '0', 10);
      });

      const platformResult = await this.contentRepo
        .createQueryBuilder('content')
        .select('content.platform', 'platform')
        .addSelect('COUNT(*)', 'count')
        .where('content.brandId = :brandId', { brandId })
        .groupBy('content.platform')
        .getRawMany();

      const byPlatform: Record<string, number> = {};
      platformResult.forEach(item => {
        byPlatform[item.platform || 'unknown'] = parseInt(item.count || '0', 10);
      });

      return {
        total,
        byStatus,
        byType,
        byPlatform,
      };
    } catch (error) {
      this.logger.error('获取内容统计信息失败:', error);
      throw error;
    }
  }
}