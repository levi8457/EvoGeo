import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { GeneratedContent } from '../../entities/generated-content.entity';
import { ComplianceCheck } from '../../entities/compliance-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GeneratedContent, ComplianceCheck])],
  controllers: [ExecutionController],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class ExecutionModule {}
