import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedContent } from '../../entities/generated-content.entity';
import { OptimizationStrategy } from '../../entities/optimization-strategy.entity';
import { Brand } from '../../entities/brand.entity';

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

      const generatedContent = this.generateContentBasedOnStrategy(strategy, dto);

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

  private generateContentBasedOnStrategy(
    strategy: OptimizationStrategy,
    dto: any,
  ): { title: string; content: string } {
    const titles = [
      'AI 品牌优化策略分析',
      '提升品牌可见性的有效方法',
      'AI 驱动的内容营销新趋势',
      '品牌数字化转型的关键步骤',
      '如何利用 AI 提升品牌影响力',
    ];

    const contents = [
      `基于 ${strategy.strategyType} 策略，我们为您生成了以下内容：\n\n` +
      '1. 品牌定位分析\n' +
      '2. 目标受众洞察\n' +
      '3. 内容优化建议\n' +
      '4. 平台发布策略\n' +
      '5. 效果评估方案',

      `根据我们的 ${strategy.strategyType} 策略，您的品牌可以通过以下方式提升可见性：\n\n` +
      '• 优化内容结构，提高搜索引擎排名\n' +
      '• 增强社交媒体互动，扩大品牌影响力\n' +
      '• 利用 AI 工具分析用户行为，精准定位目标受众\n' +
      '• 定期发布高质量内容，建立品牌权威性\n' +
      '• 监控竞争对手动态，及时调整策略',

      `基于 ${strategy.strategyType} 策略的内容建议：\n\n` +
      '【内容主题】：AI 如何改变品牌营销\n' +
      '【目标平台】：' + dto.platform + '\n' +
      '【核心观点】：\n' +
      '1. AI 驱动的个性化内容推荐\n' +
      '2. 智能数据分析提升营销效果\n' +
      '3. 自动化内容生成提高效率\n' +
      '4. 实时用户反馈优化策略\n' +
      '5. 跨平台整合营销方案',
    ];

    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomContent = contents[Math.floor(Math.random() * contents.length)];

    return {
      title: randomTitle,
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
        .select('content.status, COUNT(*) as count')
        .where('content.brandId = :brandId', { brandId })
        .groupBy('content.status')
        .getRawMany();

      const byStatus: Record<string, number> = {};
      statusResult.forEach(item => {
        byStatus[item.status] = parseInt(item.count, 10);
      });

      const typeResult = await this.contentRepo
        .createQueryBuilder('content')
        .select('content.contentType, COUNT(*) as count')
        .where('content.brandId = :brandId', { brandId })
        .groupBy('content.contentType')
        .getRawMany();

      const byType: Record<string, number> = {};
      typeResult.forEach(item => {
        byType[item.contentType] = parseInt(item.count, 10);
      });

      const platformResult = await this.contentRepo
        .createQueryBuilder('content')
        .select('content.platform, COUNT(*) as count')
        .where('content.brandId = :brandId', { brandId })
        .groupBy('content.platform')
        .getRawMany();

      const byPlatform: Record<string, number> = {};
      platformResult.forEach(item => {
        byPlatform[item.platform] = parseInt(item.count, 10);
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
