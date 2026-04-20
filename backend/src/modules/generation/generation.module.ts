import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { GeneratedContent } from '../../entities/generated-content.entity';
import { OptimizationStrategy } from '../../entities/optimization-strategy.entity';
import { Brand } from '../../entities/brand.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GeneratedContent,
      OptimizationStrategy,
      Brand,
    ]),
  ],
  controllers: [GenerationController],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}
