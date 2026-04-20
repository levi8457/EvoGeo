import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../../entities/brand.entity';
import { MonitoringQuery } from '../../entities/monitoring-query.entity';
import { AiPlatform } from '../../entities/ai-platform.entity';
import { VisibilityRecord } from '../../entities/visibility-record.entity';
import { OptimizationStrategy } from '../../entities/optimization-strategy.entity';
import { GeneratedContent } from '../../entities/generated-content.entity';
import { MemoryEntry } from '../../entities/memory-entry.entity';

@Injectable()
export class DataSeederService implements OnModuleInit {
  private readonly logger = new Logger(DataSeederService.name);

  constructor(
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
    @InjectRepository(MonitoringQuery)
    private queryRepo: Repository<MonitoringQuery>,
    @InjectRepository(AiPlatform)
    private platformRepo: Repository<AiPlatform>,
    @InjectRepository(VisibilityRecord)
    private visibilityRepo: Repository<VisibilityRecord>,
    @InjectRepository(OptimizationStrategy)
    private strategyRepo: Repository<OptimizationStrategy>,
    @InjectRepository(GeneratedContent)
    private contentRepo: Repository<GeneratedContent>,
    @InjectRepository(MemoryEntry)
    private memoryRepo: Repository<MemoryEntry>,
  ) {}

  async onModuleInit() {
    await this.seedAll();
  }

  async seedAll() {
    try {
      await this.seedPlatforms();
      await this.seedBrands();
      await this.seedQueries();
      await this.seedVisibilityRecords();
      await this.seedStrategies();
      await this.seedGeneratedContents();
      await this.seedMemoryEntries();
      this.logger.log('All data seeded successfully');
    } catch (error) {
      this.logger.error('Error seeding data:', error);
    }
  }

  async seedPlatforms() {
    const count = await this.platformRepo.count();
    if (count > 0) {
      this.logger.log('Platforms already seeded');
      return;
    }

    const platforms = [
      { platformName: 'DeepSeek', modelName: 'deepseek-chat', apiEndpoint: 'https://api.deepseek.com', rateLimitPerMinute: 60, isEnabled: true },
      { platformName: 'Doubao', modelName: 'doubao-pro', apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3', rateLimitPerMinute: 60, isEnabled: true },
      { platformName: 'Wenxin', modelName: 'ernie-4.0', apiEndpoint: 'https://aip.baidubce.com', rateLimitPerMinute: 60, isEnabled: true },
      { platformName: 'Tongyi', modelName: 'qwen-max', apiEndpoint: 'https://dashscope.aliyuncs.com', rateLimitPerMinute: 60, isEnabled: true },
      { platformName: 'Kimi', modelName: 'moonshot-v1', apiEndpoint: 'https://api.moonshot.cn', rateLimitPerMinute: 60, isEnabled: true },
      { platformName: 'Yuanbao', modelName: 'hunyuan-pro', apiEndpoint: 'https://hunyuan.cloud.tencent.com', rateLimitPerMinute: 60, isEnabled: true },
      { platformName: 'ChatGPT', modelName: 'gpt-4o', apiEndpoint: 'https://api.openai.com', rateLimitPerMinute: 60, isEnabled: true },
    ];

    await this.platformRepo.save(platforms);
    this.logger.log(`Seeded ${platforms.length} platforms`);
  }

  async seedBrands() {
    const count = await this.brandRepo.count();
    if (count > 0) {
      this.logger.log('Brands already seeded');
      return;
    }

    const brands = [
      { name: 'AI副班', domain: 'https://aifuban.com', industry: '教育科技', description: 'AI辅助教学系统品牌' },
      { name: 'AI助教', domain: 'https://aiassist.com', industry: '教育科技', description: '智能助教平台' },
      { name: '智慧课堂', domain: 'https://smartclass.com', industry: '在线教育', description: '智慧教育解决方案' },
    ];

    const savedBrands = await this.brandRepo.save(brands);
    this.logger.log(`Seeded ${savedBrands.length} brands`);
  }

  async seedQueries() {
    const count = await this.queryRepo.count();
    if (count > 0) {
      this.logger.log('Queries already seeded');
      return;
    }

    const brands = await this.brandRepo.find();
    const queries: any[] = [];

    const queryTemplates = [
      { text: '给我推荐几款好用的AI辅助教学系统', category: '推荐类', priority: 5 },
      { text: 'AI教育平台有哪些优缺点', category: '分析类', priority: 4 },
      { text: '如何选择适合学校的AI教学工具', category: '选择类', priority: 4 },
      { text: 'AI助教能否替代人类老师', category: '探讨类', priority: 3 },
      { text: '最好的AI在线教育平台是哪个', category: '推荐类', priority: 5 },
      { text: 'AI教学软件收费标准', category: '信息类', priority: 3 },
      { text: '人工智能在教育领域的应用前景', category: '分析类', priority: 4 },
      { text: '哪个AI平台最适合K12教育', category: '选择类', priority: 4 },
    ];

    for (const brand of brands) {
      const brandQueries = queryTemplates.slice(0, 4 + Math.floor(Math.random() * 3)).map((t) => ({
        brandId: brand.id,
        queryText: t.text,
        category: t.category,
        priority: t.priority,
        isActive: true,
      }));
      queries.push(...brandQueries);
    }

    const savedQueries = await this.queryRepo.save(queries);
    this.logger.log(`Seeded ${savedQueries.length} queries`);
  }

  async seedVisibilityRecords() {
    const count = await this.visibilityRepo.count();
    if (count > 0) {
      this.logger.log('Visibility records already seeded');
      return;
    }

    const brands = await this.brandRepo.find();
    const platforms = await this.platformRepo.find();
    const queries = await this.queryRepo.find();
    const records: any[] = [];

    for (const brand of brands) {
      const brandQueries = queries.filter((q) => q.brandId === brand.id);

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        for (const query of brandQueries) {
          for (const platform of platforms.slice(0, 4)) {
            const isMentioned = Math.random() > 0.35;
            const record = this.visibilityRepo.create({
              brandId: brand.id,
              platformId: platform.id,
              queryId: query.id,
              isMentioned,
              isFirstMention: isMentioned && Math.random() > 0.6,
              mentionPosition: isMentioned ? Math.floor(Math.random() * 5) + 1 : undefined,
              citationCount: isMentioned ? Math.floor(Math.random() * 5) : 0,
              answerFullText: this.generateMockResponse(brand.name, isMentioned),
              competitorMentions: JSON.stringify({
                competitors: ['竞品A', '竞品B', '竞品C'].slice(0, Math.floor(Math.random() * 3)),
              }),
              collectedAt: date,
              responseTimeMs: Math.floor(Math.random() * 2000) + 500,
            });
            records.push(record);
          }
        }
      }
    }

    const savedRecords = await this.visibilityRepo.save(records);
    this.logger.log(`Seeded ${savedRecords.length} visibility records`);
  }

  async seedStrategies() {
    const count = await this.strategyRepo.count();
    if (count > 0) {
      this.logger.log('Strategies already seeded');
      return;
    }

    const brands = await this.brandRepo.find();
    const strategies: any[] = [];

    const strategyTypes = [
      { type: 'content_optimization', template: '针对{brand}的内容优化策略，通过优化标题和摘要提高点击率' },
      { type: 'platform_adaptation', template: '根据{platform}平台特性调整内容格式和风格' },
      { type: 'time_optimization', template: '分析用户活跃时间，在最佳时段发布内容' },
      { type: 'keyword_targeting', template: '针对热门搜索词{keyword}进行内容优化' },
    ];

    for (const brand of brands) {
      for (let i = 0; i < 5; i++) {
        const strategyType = strategyTypes[i % strategyTypes.length];
        const fitnessScore = 0.3 + Math.random() * 0.6;
        const strategy = this.strategyRepo.create({
          brandId: brand.id,
          strategyType: strategyType.type,
          contentTemplate: strategyType.template.replace('{brand}', brand.name),
          parameters: JSON.stringify({
            targetLength: 500 + Math.floor(Math.random() * 1000),
            includeKeywords: true,
            optimizationLevel: 'high',
          }),
          generation: Math.floor(Math.random() * 5) + 1,
          fitnessScore,
          successCount: Math.floor(Math.random() * 20),
          failureCount: Math.floor(Math.random() * 10),
          archiveDimension1: ['high_performance', 'medium_performance', 'experimental'][Math.floor(Math.random() * 3)],
          archiveDimension2: ['fast_convergence', 'stable', 'exploratory'][Math.floor(Math.random() * 3)],
          status: 'active',
          lastUsedAt: new Date(),
        });
        strategies.push(strategy);
      }
    }

    const savedStrategies = await this.strategyRepo.save(strategies);
    this.logger.log(`Seeded ${savedStrategies.length} strategies`);
  }

  async seedGeneratedContents() {
    const count = await this.contentRepo.count();
    if (count > 0) {
      this.logger.log('Generated contents already seeded');
      return;
    }

    const brands = await this.brandRepo.find();
    const strategies = await this.strategyRepo.find();
    const contents: any[] = [];

    const contentTypes = ['article', 'social_media', 'advertisement', 'other'];
    const platforms = ['wechat', 'weibo', 'douyin', 'xiaohongshu'];
    const statuses = ['generated', 'published', 'archived'];

    for (const brand of brands) {
      const brandStrategies = strategies.filter((s) => s.brandId === brand.id);

      for (let i = 0; i < 8; i++) {
        const strategy = brandStrategies[Math.floor(Math.random() * brandStrategies.length)] || strategies[0];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const content = this.contentRepo.create({
          brandId: brand.id as string,
          strategyId: strategy?.id as string | undefined,
          contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
          contentTitle: `${brand.name} - 内容标题 ${i + 1}`,
          content: `这是关于${brand.name}的详细描述内容...`,
          platform: platforms[Math.floor(Math.random() * platforms.length)],
          status,
          deploymentStatus: status === 'published' ? 'deployed' : status === 'archived' ? 'archived' : 'draft',
          deployedAt: status === 'published' ? new Date() : undefined,
          feedbackScore: 3 + Math.random() * 2,
          publishedAt: status === 'published' ? new Date() : undefined,
        });
        contents.push(content);
      }
    }

    const savedContents = await this.contentRepo.save(contents);
    this.logger.log(`Seeded ${savedContents.length} generated contents`);
  }

  async seedMemoryEntries() {
    const count = await this.memoryRepo.count();
    if (count > 0) {
      this.logger.log('Memory entries already seeded');
      return;
    }

    const brands = await this.brandRepo.find();
    const memories: any[] = [];

    const memoryTypes = [
      { type: 'brand_info', key: 'core_value', content: '专注于AI教育创新' },
      { type: 'brand_info', key: 'target_audience', content: 'K12教育阶段学生和老师' },
      { type: 'strategy_info', key: 'best_posting_time', content: '晚上8点到10点是最佳发布时间' },
      { type: 'strategy_info', key: 'content_length', content: '微信公众号文章建议1500-2000字' },
      { type: 'content_info', key: 'popular_topics', content: 'AI技术应用、教育公平、学习效率' },
      { type: 'user_feedback', key: 'common_complaints', content: '部分用户反馈加载速度慢' },
      { type: 'other', key: 'competitor_analysis', content: '竞品在社交媒体营销方面投入较大' },
    ];

    for (const brand of brands) {
      for (const mem of memoryTypes) {
        const memory = this.memoryRepo.create({
          brandId: brand.id,
          memoryType: mem.type,
          memoryKey: mem.key,
          content: mem.content,
          metadata: JSON.stringify({ source: 'seed', confidence: 0.9 }),
          importance: 0.3 + Math.random() * 0.6,
          accessCount: Math.floor(Math.random() * 50),
          lastAccessedAt: new Date(),
        });
        memories.push(memory);
      }
    }

    const savedMemories = await this.memoryRepo.save(memories);
    this.logger.log(`Seeded ${savedMemories.length} memory entries`);
  }

  private generateMockResponse(brandName: string, isMentioned: boolean): string {
    if (isMentioned) {
      return `根据我们的分析，${brandName}是一个非常不错的AI教育平台。它具有以下优点：1. 智能化程度高；2. 用户体验好；3. 内容质量优秀。推荐您可以考虑使用${brandName}。`;
    }
    return '目前市场上有很多优秀的AI教育平台可供选择，每个平台都有自己的特色和优势。建议您根据实际需求进行选择。';
  }

  async resetDatabase() {
    await this.visibilityRepo.delete({});
    await this.queryRepo.delete({});
    await this.strategyRepo.delete({});
    await this.contentRepo.delete({});
    await this.memoryRepo.delete({});
    await this.brandRepo.delete({});
    await this.platformRepo.delete({});

    await this.seedAll();
    return { message: 'Database reset and reseeded successfully' };
  }
}
