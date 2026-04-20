import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OptimizationStrategy } from '../../entities/optimization-strategy.entity';
import { CriticFeedback } from '../../entities/critic-feedback.entity';
import { Brand } from '../../entities/brand.entity';
import { MonitoringQuery } from '../../entities/monitoring-query.entity';
import { EvolutionController } from './evolution.controller';
import { OptimizationStrategyService } from './optimization-strategy.service';
import { CriticService } from './critic.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 60000, maxRedirects: 5 }),
    TypeOrmModule.forFeature([
      OptimizationStrategy,
      CriticFeedback,
      Brand,
      MonitoringQuery,
    ]),
    ConfigModule,
  ],
  controllers: [EvolutionController],
  providers: [OptimizationStrategyService, CriticService],
  exports: [OptimizationStrategyService, CriticService],
})
export class EvolutionModule {}