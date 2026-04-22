import { Controller, Get, Post, Put, Delete, Query, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { OptimizationStrategyService } from './optimization-strategy.service';
import { CriticService } from './critic.service';

class CreateStrategyDto {
  brandId: string;
  strategyType: string;
  contentTemplate: string;
  parameters?: Record<string, any>;
  archiveDimension1?: string;
  archiveDimension2?: string;
}

class UpdateStrategyDto {
  contentTemplate?: string;
  parameters?: Record<string, any>;
  status?: string;
}

class EvaluateStrategyDto {
  strategyId: string;
  queryId: string;
  predictedScore: number;
  actualScore: number;
  features?: Record<string, any>;
  feedbackText?: string;
}

class EvolveStrategyDto {
  strategyId: string;
  mutationRate?: number;
  crossoverRate?: number;
}

@Controller('api/evolution')
export class EvolutionController {
  constructor(
    private readonly strategyService: OptimizationStrategyService,
    private readonly criticService: CriticService,
  ) {}

  @Get('strategies')
  async getStrategies(
    @Query('brandId') brandId?: string,
    @Query('strategyType') strategyType?: string,
  ) {
    return this.strategyService.getStrategies(brandId, strategyType);
  }

  @Post('strategies')
  async createStrategy(@Body() dto: CreateStrategyDto) {
    return this.strategyService.createStrategy(dto);
  }

  @Get('strategies/:id')
  async getStrategy(@Param('id') id: string) {
    return this.strategyService.getStrategyById(id);
  }

  @Put('strategies/:id')
  async updateStrategy(@Param('id') id: string, @Body() dto: UpdateStrategyDto) {
    return this.strategyService.updateStrategy(id, dto);
  }

  @Delete('strategies/:id')
  async deleteStrategy(@Param('id') id: string) {
    return this.strategyService.deleteStrategy(id);
  }

  @Post('strategies/:id/evolve')
  async evolveStrategy(@Param('id') id: string, @Body() dto: EvolveStrategyDto) {
    return this.strategyService.evolveStrategy(id, dto.mutationRate, dto.crossoverRate);
  }

  @Post('strategies/:id/evaluate')
  async evaluateStrategy(@Param('id') id: string, @Body() dto: EvaluateStrategyDto) {
    return this.strategyService.evaluateStrategy(
      id,
      dto.queryId,
      dto.predictedScore,
      dto.actualScore,
      dto.features,
      dto.feedbackText,
    );
  }

  @Get('dashboard')
  async getEvolutionDashboard(
    @Query('brandId') brandId: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.strategyService.getEvolutionDashboard(brandId, timeRange);
  }

  @Get('critic/feedback')
  async getCriticFeedback(
    @Query('strategyId') strategyId?: string,
    @Query('queryId') queryId?: string,
  ) {
    return this.criticService.getFeedback(strategyId, queryId);
  }

  @Post('critic/feedback')
  async createCriticFeedback(@Body() dto: EvaluateStrategyDto) {
    return this.criticService.createFeedback(
      dto.strategyId,
      dto.queryId,
      dto.predictedScore,
      dto.actualScore,
      dto.features,
      dto.feedbackText,
    );
  }

  @Get('critic/stats')
  async getCriticStats(
    @Query('strategyId') strategyId?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.criticService.getStats(strategyId, timeRange);
  }

  @Get('archive')
  async getArchiveData(
    @Query('brandId') brandId: string,
    @Query('dimension1') dimension1?: string,
    @Query('dimension2') dimension2?: string,
  ) {
    return this.strategyService.getArchiveData(brandId, dimension1, dimension2);
  }

  @Get('archive/statistics')
  async getArchiveStatistics(@Query('brandId') brandId: string) {
    return this.strategyService.getArchiveStatistics(brandId);
  }
}
