import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { ComplianceCheck } from '../../entities/compliance-check.entity';
import { GeneratedContent } from '../../entities/generated-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceCheck, GeneratedContent])],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
