import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSeederService } from './data-seeder.service';
import { Brand } from '../../entities/brand.entity';
import { MonitoringQuery } from '../../entities/monitoring-query.entity';
import { AiPlatform } from '../../entities/ai-platform.entity';
import { VisibilityRecord } from '../../entities/visibility-record.entity';
import { OptimizationStrategy } from '../../entities/optimization-strategy.entity';
import { GeneratedContent } from '../../entities/generated-content.entity';
import { MemoryEntry } from '../../entities/memory-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brand,
      MonitoringQuery,
      AiPlatform,
      VisibilityRecord,
      OptimizationStrategy,
      GeneratedContent,
      MemoryEntry,
    ]),
  ],
  providers: [DataSeederService],
  exports: [DataSeederService],
})
export class CommonModule {}
