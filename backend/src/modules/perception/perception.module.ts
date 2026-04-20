import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PerceptionController } from './perception.controller';
import { PerceptionService } from './perception.service';
import { AiPlatformService } from './ai-platform.service';
import { VisibilityRecord } from '../../entities';
import { MonitoringQuery } from '../../entities';
import { AiPlatform } from '../../entities';
import { Brand } from '../../entities';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({ timeout: 60000, maxRedirects: 5 }),
    TypeOrmModule.forFeature([VisibilityRecord, MonitoringQuery, AiPlatform, Brand]),
  ],
  controllers: [PerceptionController],
  providers: [PerceptionService, AiPlatformService],
  exports: [PerceptionService, AiPlatformService],
})
export class PerceptionModule {}
