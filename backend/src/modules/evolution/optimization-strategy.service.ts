import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OptimizationStrategy } from '../../entities/optimization-strategy.entity';
import { CriticFeedback } from '../../entities/critic-feedback.entity';
import { MonitoringQuery } from '../../entities/monitoring-query.entity';
import { Brand } from '../../entities/brand.entity';

@Injectable()
export class OptimizationStrategyService {
  private readonly logger = new Logger(OptimizationStrategyService.name);

  constructor(
    @InjectRepository(OptimizationStrategy)
    private strategyRepo: Repository<OptimizationStrategy>,
    @InjectRepository(CriticFeedback)
    private criticRepo: Repository<CriticFeedback>,
    @InjectRepository(MonitoringQuery)
    private queryRepo: Repository<MonitoringQuery>,
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
  ) {}

  async getStrategies(brandId?: string, strategyType?: string, page: number = 1, pageSize: number = 10) {
    const query = this.strategyRepo.createQueryBuilder('strategy');

    if (brandId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(brandId)) {
        query.where('strategy.brandId = :brandId', { brandId });
      }
    }

    if (strategyType) {
      query.andWhere('strategy.strategyType = :strategyType', { strategyType });
    }

    const [items, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getStrategyById(id: string) {
    const strategy = await this.strategyRepo.findOne({ where: { id } });
    if (!strategy) {
      throw new NotFoundException('策略不存在');
    }
    return strategy;
  }

  async createStrategy(dto: {
    brandId: string;
    strategyType: string;
    contentTemplate: string;
    parameters?: Record<string, any>;
    archiveDimension1?: string;
    archiveDimension2?: string;
  }) {
    try {
      let brand = await this.brandRepo.findOne({ where: { id: dto.brandId } });
      if (!brand) {
        brand = this.brandRepo.create({
          id: dto.brandId,
          name: `品牌 ${dto.brandId.substring(0, 8)}`,
          industry: '未知',
          description: '自动创建的品牌',
        });
        await this.brandRepo.save(brand);
      }

      const strategy = this.strategyRepo.create({
        brandId: dto.brandId,
        strategyType: dto.strategyType,
        contentTemplate: dto.contentTemplate,
        parameters: JSON.stringify(dto.parameters || {}),
        archiveDimension1: dto.archiveDimension1,
        archiveDimension2: dto.archiveDimension2,
        status: 'active',
        generation: 1,
        fitnessScore: 0,
      });

      return await this.strategyRepo.save(strategy);
    } catch (error) {
      this.logger.error('创建策略失败:', error);
      throw new Error('创建策略失败');
    }
  }

  async updateStrategy(id: string, dto: {
    strategyType?: string;
    contentTemplate?: string;
    parameters?: Record<string, any>;
    status?: string;
  }) {
    const strategy = await this.getStrategyById(id);

    if (dto.strategyType) strategy.strategyType = dto.strategyType;
    if (dto.contentTemplate) strategy.contentTemplate = dto.contentTemplate;
    if (dto.parameters) strategy.parameters = JSON.stringify(dto.parameters);
    if (dto.status) strategy.status = dto.status;

    return await this.strategyRepo.save(strategy);
  }

  async deleteStrategy(id: string) {
    const strategy = await this.getStrategyById(id);
    await this.strategyRepo.remove(strategy);
    return { success: true, message: '策略已删除' };
  }

  async evolveStrategy(
    strategyId: string,
    mutationRate: number = 0.1,
    crossoverRate: number = 0.7,
  ) {
    const parentStrategy = await this.getStrategyById(strategyId);

    const parentParams = JSON.parse(parentStrategy.parameters || '{}');

    const newStrategy = this.strategyRepo.create({
      brandId: parentStrategy.brandId,
      strategyType: parentStrategy.strategyType,
      contentTemplate: this.mutateContent(parentStrategy.contentTemplate, mutationRate),
      parameters: JSON.stringify(this.mutateParameters(parentParams, mutationRate)),
      archiveDimension1: parentStrategy.archiveDimension1,
      archiveDimension2: parentStrategy.archiveDimension2,
      status: 'active',
      generation: parentStrategy.generation + 1,
      fitnessScore: 0,
      parentStrategies: JSON.stringify([parentStrategy.id]),
    });

    return await this.strategyRepo.save(newStrategy);
  }

  async evaluateStrategy(
    strategyId: string,
    queryId: string,
    predictedScore: number,
    actualScore: number,
    features?: Record<string, any>,
    feedbackText?: string,
  ) {
    const strategy = await this.getStrategyById(strategyId);
    const query = await this.queryRepo.findOne({ where: { id: queryId } });

    if (!query) {
      throw new NotFoundException('查询不存在');
    }

    const fitnessScore = this.calculateFitness(predictedScore, actualScore);

    strategy.fitnessScore = (
      (strategy.fitnessScore * (strategy.evaluations || 0) + fitnessScore) /
      ((strategy.evaluations || 0) + 1)
    );
    strategy.evaluations = (strategy.evaluations || 0) + 1;

    await this.strategyRepo.save(strategy);

    const feedback = this.criticRepo.create({
      strategyId,
      queryId,
      predictedScore,
      actualScore,
      fitnessScore,
      features: JSON.stringify(features || {}),
      feedbackText,
    });

    await this.criticRepo.save(feedback);

    return {
      strategy: strategy,
      feedback: feedback,
    };
  }

  async getEvolutionDashboard(brandId: string, timeRange?: string) {
    const strategies = await this.strategyRepo.find({
      where: { brandId },
      order: { generation: 'ASC' },
    });

    const generationStats = strategies.reduce((acc, strategy) => {
      if (!acc[strategy.generation]) {
        acc[strategy.generation] = {
          generation: strategy.generation,
          strategies: 0,
          avgFitness: 0,
          maxFitness: 0,
          minFitness: Infinity,
        };
      }

      const stats = acc[strategy.generation];
      stats.strategies++;
      stats.avgFitness += strategy.fitnessScore;
      stats.maxFitness = Math.max(stats.maxFitness, strategy.fitnessScore);
      stats.minFitness = Math.min(stats.minFitness, strategy.fitnessScore);

      return acc;
    }, {} as Record<string, any>);

    Object.keys(generationStats).forEach(gen => {
      const stats = generationStats[gen];
      stats.avgFitness = stats.avgFitness / stats.strategies;
    });

    const topStrategies = await this.strategyRepo.find({
      where: { brandId, status: 'active' },
      order: { fitnessScore: 'DESC' },
      take: 5,
    });

    return {
      generationStats: Object.values(generationStats),
      topStrategies,
      totalStrategies: strategies.length,
      totalEvaluations: strategies.reduce((sum, s) => sum + (s.evaluations || 0), 0),
    };
  }

  private mutateContent(content: string, mutationRate: number): string {
    if (Math.random() > mutationRate) return content;

    const words = content.split(' ');
    const randomIndex = Math.floor(Math.random() * words.length);
    const mutations = [
      '优化', '改进', '增强', '提升', '强化',
      '调整', '优化调整', '精细调整', '深度优化', '全面优化',
    ];
    const randomMutation = mutations[Math.floor(Math.random() * mutations.length)];
    words[randomIndex] = randomMutation;
    return words.join(' ');
  }

  private mutateParameters(parameters: Record<string, any>, mutationRate: number): Record<string, any> {
    const mutatedParams = { ...parameters };

    Object.keys(mutatedParams).forEach(key => {
      if (Math.random() < mutationRate) {
        const value = mutatedParams[key];
        if (typeof value === 'number') {
          const mutation = (Math.random() - 0.5) * 0.2;
          mutatedParams[key] = value * (1 + mutation);
        } else if (typeof value === 'string') {
          const mutations = [
            '高', '中', '低', '强', '弱',
            '精准', '广泛', '深度', '广度', '平衡',
          ];
          mutatedParams[key] = mutations[Math.floor(Math.random() * mutations.length)];
        }
      }
    });

    return mutatedParams;
  }

  private calculateFitness(predictedScore: number, actualScore: number): number {
    const error = Math.abs(predictedScore - actualScore);
    const maxError = 100;
    const fitness = Math.max(0, 1 - (error / maxError));
    return fitness;
  }

  async getArchiveData(brandId: string, dimension1?: string, dimension2?: string) {
    const query = this.strategyRepo.createQueryBuilder('strategy')
      .where('strategy.brandId = :brandId', { brandId });

    if (dimension1) {
      query.andWhere('strategy.archiveDimension1 = :dimension1', { dimension1 });
    }

    if (dimension2) {
      query.andWhere('strategy.archiveDimension2 = :dimension2', { dimension2 });
    }

    const strategies = await query.orderBy('strategy.fitnessScore', 'DESC').getMany();

    const archiveGrid: Record<string, Record<string, any[]>> = {};
    strategies.forEach(strategy => {
      const dim1 = strategy.archiveDimension1 || 'unknown';
      const dim2 = strategy.archiveDimension2 || 'unknown';
      if (!archiveGrid[dim1]) archiveGrid[dim1] = {};
      if (!archiveGrid[dim1][dim2]) archiveGrid[dim1][dim2] = [];
      archiveGrid[dim1][dim2].push(strategy);
    });

    return {
      archive: archiveGrid,
      totalStrategies: strategies.length,
    };
  }

  async getArchiveStatistics(brandId: string) {
    const strategies = await this.strategyRepo.find({ where: { brandId } });

    const dimension1Values = new Set<string>();
    const dimension2Values = new Set<string>();
    const fitnessByDimension: Record<string, Record<string, { count: number; avgFitness: number }>> = {};

    strategies.forEach(strategy => {
      const dim1 = strategy.archiveDimension1 || 'unknown';
      const dim2 = strategy.archiveDimension2 || 'unknown';

      dimension1Values.add(dim1);
      dimension2Values.add(dim2);

      if (!fitnessByDimension[dim1]) fitnessByDimension[dim1] = {};
      if (!fitnessByDimension[dim1][dim2]) {
        fitnessByDimension[dim1][dim2] = { count: 0, avgFitness: 0 };
      }

      const current = fitnessByDimension[dim1][dim2];
      current.avgFitness = (current.avgFitness * current.count + strategy.fitnessScore) / (current.count + 1);
      current.count++;
    });

    return {
      dimension1Values: Array.from(dimension1Values),
      dimension2Values: Array.from(dimension2Values),
      totalCells: dimension1Values.size * dimension2Values.size,
      filledCells: Object.values(fitnessByDimension).reduce((acc, dim2) => acc + Object.keys(dim2).length, 0),
      fitnessByDimension,
      totalStrategies: strategies.length,
    };
  }
}
