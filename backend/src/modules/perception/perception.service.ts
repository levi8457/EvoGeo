import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { VisibilityRecord } from '../../entities/visibility-record.entity';
import { MonitoringQuery } from '../../entities/monitoring-query.entity';
import { AiPlatform } from '../../entities/ai-platform.entity';
import { Brand } from '../../entities/brand.entity';
import { AiPlatformService } from './ai-platform.service';
import { DashboardFilters, TrendDataPoint, PlatformData, CompetitorData, DashboardResponse } from './perception.types';

@Injectable()
export class PerceptionService {
  constructor(
    @InjectRepository(VisibilityRecord)
    private visibilityRepo: Repository<VisibilityRecord>,
    @InjectRepository(MonitoringQuery)
    private queryRepo: Repository<MonitoringQuery>,
    @InjectRepository(AiPlatform)
    private platformRepo: Repository<AiPlatform>,
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
    private httpService: HttpService,
    private configService: ConfigService,
    private aiPlatformService: AiPlatformService,
  ) {}

  async getDashboardData(filters: DashboardFilters) {
    const { brandId, startDate, endDate, platforms } = filters;

    const totalRecords = await this.visibilityRepo.count();
    
    const mentionedCount = await this.visibilityRepo.count({
      where: { isMentioned: true }
    });
    
    const firstMentionCount = await this.visibilityRepo.count({
      where: { isFirstMention: true }
    });
    
    const avgVisibility = totalRecords > 0 
      ? parseFloat(((mentionedCount / totalRecords) * 100).toFixed(1)) 
      : 0;
    
    const firstMentionRate = totalRecords > 0 
      ? parseFloat(((firstMentionCount / totalRecords) * 100).toFixed(1)) 
      : 0;

    // 计算平台数量
    const platformCount = await this.visibilityRepo
      .createQueryBuilder('record')
      .leftJoin('record.platform', 'platform')
      .select('COUNT(DISTINCT platform.platformName)', 'count')
      .getRawOne()
      .then(result => parseInt(result.count) || 0);

    // 趋势数据 - 使用原生聚合
    const rawTrend = await this.visibilityRepo
      .createQueryBuilder('record')
      .select("strftime('%Y-%m-%d', record.collectedAt)", 'date')
      .addSelect("SUM(CASE WHEN record.isMentioned = true THEN 1 ELSE 0 END) * 100.0 / COUNT(record.id)", 'visibility')
      .groupBy("strftime('%Y-%m-%d', record.collectedAt)")
      .orderBy("date", "ASC")
      .limit(7)
      .getRawMany();

    const trendData: TrendDataPoint[] = rawTrend.map(item => ({
      date: item.date,
      visibility: parseFloat(item.visibility || 0)
    }));

    // 平台数据 - 使用原生聚合
    const rawPlatform = await this.visibilityRepo
      .createQueryBuilder('record')
      .leftJoin('record.platform', 'platform')
      .select('platform.platformName', 'platformName')
      .addSelect('COUNT(record.id)', 'citationCount')
      .addSelect("SUM(CASE WHEN record.isMentioned = true THEN 1 ELSE 0 END) * 100.0 / COUNT(record.id)", 'visibility')
      .addSelect("SUM(CASE WHEN record.isFirstMention = true THEN 1 ELSE 0 END) > 0", 'isFirstMention')
      .groupBy('platform.platformName')
      .getRawMany();

    const platformData: PlatformData[] = rawPlatform.map(item => ({
      platformName: item.platformName || 'Unknown',
      visibility: parseFloat(item.visibility || 0),
      isFirstMention: item.isFirstMention === 't' || item.isFirstMention === 'true',
      citationCount: parseInt(item.citationCount) || 0,
      trend: 'up' as const // 暂时固定为 up，后续可以根据实际数据计算
    }));

    return {
      metrics: {
        avgVisibility,
        firstMentionRate,
        totalCitations: totalRecords,
        platformCount,
      },
      trendData,
      platformData,
      competitorData: [],
    };
  }

  private async getTotalCitations(brandId: string, startDate?: string, endDate?: string) {
    let qb = this.visibilityRepo
      .createQueryBuilder('vr')
      .select('SUM(vr.citation_count)', 'total')
      .where('vr.brand_id = :brandId', { brandId });

    if (startDate && endDate) {
      qb = qb.andWhere('vr.collected_at BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const result = await qb.getRawOne();
    return parseInt(result.total) || 0;
  }

  private async getCompetitorData(brandId: string) {
    return [];
  }

  async getVisibilityRecords(brandId: string, startDate?: string, endDate?: string) {
    let qb = this.visibilityRepo
      .createQueryBuilder('vr')
      .leftJoinAndSelect('vr.platform', 'platform')
      .leftJoinAndSelect('vr.query', 'query')
      .where('vr.brand_id = :brandId', { brandId });

    if (startDate && endDate) {
      qb = qb.andWhere('vr.collected_at BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return qb.orderBy('vr.collected_at', 'DESC').getMany();
  }

  async runImmediateCheck(queryId: string, platforms: string[]) {
    const query = await this.queryRepo.findOne({
      where: { id: queryId },
      relations: ['brand'],
    });
    if (!query) throw new NotFoundException('查询不存在');
    if (!query.brand) throw new NotFoundException('该查询的品牌不存在');

    const results = await this.aiPlatformService.queryMultiplePlatforms(
      platforms,
      query.queryText,
      query.brand.name,
      query.brandId,
      queryId,
    );

    const successCount = results.filter((r) => !r.error).length;
    const mentionedCount = results.filter((r) => r.isMentioned).length;

    return {
      success: true,
      totalPlatforms: platforms.length,
      successCount,
      mentionedCount,
      results,
    };
  }

  async getCompetitorAnalysis(brandId: string, queryId?: string) {
    const brand = await this.brandRepo.findOne({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('品牌不存在');

    const qb = this.visibilityRepo
      .createQueryBuilder('vr')
      .leftJoin('vr.platform', 'platform')
      .leftJoin('vr.query', 'query')
      .select('platform.platformName', 'platformName')
      .addSelect('query.queryText', 'queryText')
      .addSelect('vr.answerFullText', 'answerFullText')
      .addSelect('vr.isMentioned', 'isMentioned')
      .addSelect('vr.isFirstMention', 'isFirstMention')
      .addSelect('vr.collectedAt', 'collectedAt')
      .where('vr.brandId = :brandId', { brandId })
      .orderBy('vr.collectedAt', 'DESC')
      .limit(50);

    if (queryId) {
      qb.andWhere('vr.queryId = :queryId', { queryId });
    }

    const records = await qb.getRawMany();

    const competitorKeywords = ['竞品', '对手', '其他', '替代'];
    const competitorMentions: Map<string, { count: number; platforms: string[] }> = new Map();

    for (const record of records) {
      if (!record.answerFullText) continue;

      const text = record.answerFullText.toLowerCase();
      const brandName = brand.name.toLowerCase();

      const mentionPatterns = [
        /推荐[：:]\s*([^\n。！？]+)/g,
        /如下[：:]\s*([^\n。！？]+)/g,
        /包括[：:]\s*([^\n。！？]+)/g,
        /有[：:]\s*([^\n。！？]+)/g,
      ];

      for (const pattern of mentionPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          const mentionText = match[1];
          const words = mentionText.split(/[,，、\s]+/).filter((w: string) => w.length > 1);

          for (const word of words) {
            if (word.includes(brandName)) continue;
            if (competitorKeywords.some((kw) => word.includes(kw))) continue;

            const existing = competitorMentions.get(word) || { count: 0, platforms: [] };
            existing.count++;
            if (!existing.platforms.includes(record.platformName)) {
              existing.platforms.push(record.platformName);
            }
            competitorMentions.set(word, existing);
          }
        }
      }
    }

    const competitors = Array.from(competitorMentions.entries())
      .map(([name, data]) => ({
        name,
        mentionCount: data.count,
        platforms: data.platforms,
      }))
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, 10);

    return {
      brandId,
      brandName: brand.name,
      queryId,
      totalRecords: records.length,
      competitors,
    };
  }

  async testDeepSeekAPI() {
    return this.aiPlatformService.testPlatformConnection('deepseek');
  }

  async analyzeBrandVisibility(brandName: string, query: string) {
    let brand = await this.brandRepo.findOne({ where: { name: brandName } });
    if (!brand) {
      brand = await this.brandRepo.save({ name: brandName });
    }

    const monitoringQuery = await this.queryRepo.save({
      brandId: brand.id,
      queryText: query,
      category: 'GEO测试',
      priority: 1,
      isActive: true,
    });

    const result = await this.aiPlatformService.queryPlatform(
      'deepseek',
      query,
      brandName,
      brand.id,
      monitoringQuery.id,
    );

    return {
      query,
      brandName,
      isMentioned: result.isMentioned,
      isFirstMention: result.isFirstMention,
      responseText: result.responseText,
      error: result.error,
    };
  }

  @Cron('0 2 * * *')
  async runDailyPerceptionScan() {
    const tasks = [
      { brandName: 'AI副班', query: '给我推荐几款好用的AI辅助教学系统' }
    ];

    for (const task of tasks) {
      console.log('[定时任务] 正在执行每日感知巡检...', task.brandName);
      await this.analyzeBrandVisibility(task.brandName, task.query);
    }
  }

  async seedHistoricalData() {
    const manager = this.visibilityRepo.manager;

    // 1. 获取真实 Brand
    let brand = await manager.findOne('Brand', { where: { name: 'AI副班' } });
    if (!brand) {
      brand = await manager.save('Brand', { name: 'AI副班' });
    }

    // 2. 获取真实 Platform
    let platform = await manager.findOne('AiPlatform', { where: { platformName: 'DeepSeek' } });
    if (!platform) {
      platform = await manager.save('AiPlatform', { platformName: 'DeepSeek', modelName: 'deepseek-chat', apiEndpoint: 'https://api.deepseek.com' });
    }

    // 3. 获取或创建 MonitoringQuery
    let query = await manager.findOne('MonitoringQuery', { where: { brandId: (brand as any).id } });
    if (!query) {
      query = await manager.save('MonitoringQuery', {
        brandId: (brand as any).id,
        queryText: '给我推荐几款好用的AI辅助教学系统',
        category: '推荐类',
        priority: 3,
        isActive: true,
      });
    }

    const records: any[] = [];
    
    // 生成过去 7 天的数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      for (let j = 0; j < 3; j++) {
        const record = this.visibilityRepo.create({
          brandId: (brand as any).id,
          platformId: (platform as any).id,
          queryId: (query as any).id,
          isMentioned: Math.random() > 0.4,
          isFirstMention: Math.random() > 0.7,
          citationCount: Math.floor(Math.random() * 3),
          answerFullText: '这是模拟大模型返回的历史文本...',
          collectedAt: date,
        } as any);
        records.push(record);
      }
    }
    
    await this.visibilityRepo.save(records);
    return { message: '历史数据生成成功！请刷新前端大屏。' };
  }

  async getAllBrands() {
    return this.brandRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getQueries(brandId?: string) {
    const qb = this.queryRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.brand', 'brand')
      .leftJoinAndSelect('q.visibilityRecords', 'vr')
      .orderBy('q.createdAt', 'DESC');

    if (brandId) {
      qb.where('q.brandId = :brandId', { brandId });
    }

    const queries = await qb.getMany();

    return queries.map((q) => ({
      id: q.id,
      brandId: q.brandId,
      brandName: q.brand?.name,
      queryText: q.queryText,
      category: q.category,
      priority: q.priority,
      isActive: q.isActive,
      createdAt: q.createdAt,
      totalChecks: q.visibilityRecords?.length || 0,
      mentionedCount: q.visibilityRecords?.filter((r) => r.isMentioned).length || 0,
      avgVisibility: q.visibilityRecords?.length
        ? parseFloat(((q.visibilityRecords.filter((r) => r.isMentioned).length / q.visibilityRecords.length) * 100).toFixed(1))
        : 0,
    }));
  }

  async getQueryById(id: string) {
    const query = await this.queryRepo.findOne({
      where: { id },
      relations: ['brand', 'visibilityRecords', 'visibilityRecords.platform'],
    });

    if (!query) throw new NotFoundException('查询不存在');

    return {
      id: query.id,
      brandId: query.brandId,
      brandName: query.brand?.name,
      queryText: query.queryText,
      category: query.category,
      priority: query.priority,
      isActive: query.isActive,
      createdAt: query.createdAt,
      visibilityRecords: query.visibilityRecords?.map((r) => ({
        id: r.id,
        platformName: r.platform?.platformName,
        isMentioned: r.isMentioned,
        isFirstMention: r.isFirstMention,
        mentionPosition: r.mentionPosition,
        citationCount: r.citationCount,
        collectedAt: r.collectedAt,
        responseTimeMs: r.responseTimeMs,
      })),
    };
  }

  async createQuery(dto: { brandId: string; queryText: string; category?: string; priority?: number }) {
    const brand = await this.brandRepo.findOne({ where: { id: dto.brandId } });
    if (!brand) throw new NotFoundException('品牌不存在');

    const query = this.queryRepo.create({
      brandId: dto.brandId,
      queryText: dto.queryText,
      category: dto.category || '通用',
      priority: dto.priority || 1,
      isActive: true,
    });

    return this.queryRepo.save(query);
  }

  async updateQuery(id: string, dto: { queryText?: string; category?: string; priority?: number; isActive?: boolean }) {
    const query = await this.queryRepo.findOne({ where: { id } });
    if (!query) throw new NotFoundException('查询不存在');

    if (dto.queryText !== undefined) query.queryText = dto.queryText;
    if (dto.category !== undefined) query.category = dto.category;
    if (dto.priority !== undefined) query.priority = dto.priority;
    if (dto.isActive !== undefined) query.isActive = dto.isActive;

    return this.queryRepo.save(query);
  }

  async deleteQuery(id: string) {
    const query = await this.queryRepo.findOne({ where: { id } });
    if (!query) throw new NotFoundException('查询不存在');

    await this.queryRepo.remove(query);
    return { message: '查询删除成功' };
  }
}
