import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CriticFeedback } from '../../entities/critic-feedback.entity';

@Injectable()
export class CriticService {
  private readonly logger = new Logger(CriticService.name);

  constructor(
    @InjectRepository(CriticFeedback)
    private criticRepo: Repository<CriticFeedback>,
  ) {}

  async getFeedback(strategyId?: string, queryId?: string) {
    const query = this.criticRepo.createQueryBuilder('feedback');

    if (strategyId) {
      query.where('feedback.strategyId = :strategyId', { strategyId });
    }

    if (queryId) {
      query.where('feedback.queryId = :queryId', { queryId });
    }

    query.orderBy('feedback.createdAt', 'DESC');

    return await query.getMany();
  }

  async createFeedback(
    strategyId: string,
    queryId: string,
    predictedScore: number,
    actualScore: number,
    features?: Record<string, any>,
    feedbackText?: string,
  ) {
    const feedback = this.criticRepo.create({
      strategyId,
      queryId,
      predictedScore,
      actualScore,
      fitnessScore: this.calculateFitness(predictedScore, actualScore),
      features: features ? JSON.stringify(features) : undefined,
      feedbackText,
    });

    return await this.criticRepo.save(feedback);
  }

  async getStats(strategyId?: string, timeRange?: string) {
    const query = this.criticRepo.createQueryBuilder('feedback');

    if (strategyId) {
      query.where('feedback.strategyId = :strategyId', { strategyId });
    }

    if (timeRange) {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      query.where('feedback.createdAt >= :startDate', { startDate });
    }

    const feedbacks = await query.getMany();

    if (feedbacks.length === 0) {
      return {
        totalEvaluations: 0,
        avgFitness: 0,
        avgError: 0,
        maxFitness: 0,
        minFitness: 0,
        errorDistribution: {
          low: 0,
          medium: 0,
          high: 0,
        },
      };
    }

    const totalFitness = feedbacks.reduce((sum, f) => sum + f.fitnessScore, 0);
    const totalError = feedbacks.reduce((sum, f) => sum + Math.abs(f.predictedScore - f.actualScore), 0);

    const errorDistribution = feedbacks.reduce((acc, f) => {
      const error = Math.abs(f.predictedScore - f.actualScore);
      if (error < 10) acc.low++;
      else if (error < 30) acc.medium++;
      else acc.high++;
      return acc;
    }, { low: 0, medium: 0, high: 0 });

    return {
      totalEvaluations: feedbacks.length,
      avgFitness: totalFitness / feedbacks.length,
      avgError: totalError / feedbacks.length,
      maxFitness: Math.max(...feedbacks.map(f => f.fitnessScore)),
      minFitness: Math.min(...feedbacks.map(f => f.fitnessScore)),
      errorDistribution,
    };
  }

  async getFeedbackTrend(strategyId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const feedbacks = await this.criticRepo.find({
      where: {
        strategyId,
        createdAt: MoreThanOrEqual(startDate),
      },
      order: { createdAt: 'ASC' },
    });

    const dailyStats = feedbacks.reduce((acc, feedback) => {
      const date = new Date(feedback.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          evaluations: 0,
          avgFitness: 0,
          avgError: 0,
        };
      }

      const stats = acc[date];
      stats.evaluations++;
      stats.avgFitness += feedback.fitnessScore;
      stats.avgError += Math.abs(feedback.predictedScore - feedback.actualScore);

      return acc;
    }, {} as Record<string, any>);

    Object.keys(dailyStats).forEach(date => {
      const stats = dailyStats[date];
      stats.avgFitness = stats.avgFitness / stats.evaluations;
      stats.avgError = stats.avgError / stats.evaluations;
    });

    return Object.values(dailyStats);
  }

  private calculateFitness(predictedScore: number, actualScore: number): number {
    const error = Math.abs(predictedScore - actualScore);
    const maxError = 100;
    const fitness = Math.max(0, 1 - (error / maxError));
    return fitness;
  }
}
