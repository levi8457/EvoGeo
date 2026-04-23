import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { GeneratedContent } from '../../entities/generated-content.entity';
import { OptimizationStrategy } from '../../entities/optimization-strategy.entity';
import { Brand } from '../../entities/brand.entity';
import { AiPlatform } from '../../entities/ai-platform.entity';
import { VisibilityRecord } from '../../entities/visibility-record.entity';
import { MonitoringQuery } from '../../entities/monitoring-query.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      GeneratedContent,
      OptimizationStrategy,
      Brand,
      AiPlatform,
      VisibilityRecord,
      MonitoringQuery,
    ]),
    HttpModule,
  ],
  controllers: [GenerationController],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}