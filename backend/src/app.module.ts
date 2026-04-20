import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerceptionModule } from './modules/perception/perception.module';
import { EvolutionModule } from './modules/evolution/evolution.module';
import { GenerationModule } from './modules/generation/generation.module';
import { MemoryModule } from './modules/memory/memory.module';
import { ExecutionModule } from './modules/execution/execution.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { CommonModule } from './modules/common/common.module';
import {
  Brand,
  MonitoringQuery,
  AiPlatform,
  VisibilityRecord,
  OptimizationStrategy,
  GeneratedContent,
  MemoryEntry,
  ComplianceCheck,
  CriticFeedback,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'evogeo.db',
      entities: [
        Brand,
        MonitoringQuery,
        AiPlatform,
        VisibilityRecord,
        OptimizationStrategy,
        GeneratedContent,
        MemoryEntry,
        ComplianceCheck,
        CriticFeedback,
      ],
      synchronize: true,
    }),
    PerceptionModule,
    EvolutionModule,
    GenerationModule,
    MemoryModule,
    ExecutionModule,
    ComplianceModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
