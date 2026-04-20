import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';
import { ChromaDbService } from './chroma-db.service';
import { MemoryEntry } from '../../entities/memory-entry.entity';
import { Brand } from '../../entities/brand.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MemoryEntry,
      Brand,
    ]),
  ],
  controllers: [MemoryController],
  providers: [MemoryService, ChromaDbService],
  exports: [MemoryService, ChromaDbService],
})
export class MemoryModule {}
