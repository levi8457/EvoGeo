import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemoryEntry } from '../../entities/memory-entry.entity';
import { Brand } from '../../entities/brand.entity';
import { ChromaDbService } from './chroma-db.service';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    @InjectRepository(MemoryEntry)
    private memoryRepo: Repository<MemoryEntry>,
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
    private chromaDbService: ChromaDbService,
  ) {}

  async createMemoryEntry(dto: {
    brandId: string;
    memoryType: string;
    memoryKey: string;
    content: string;
    metadata?: Record<string, any>;
    importance?: number;
  }) {
    try {
      const brand = await this.brandRepo.findOne({ where: { id: dto.brandId } });
      if (!brand) {
        throw new NotFoundException('品牌不存在');
      }

      if (dto.importance && (dto.importance < 1 || dto.importance > 5)) {
        throw new BadRequestException('重要性级别必须在1-5之间');
      }

      const memoryEntry = this.memoryRepo.create({
        brandId: dto.brandId,
        memoryType: dto.memoryType,
        memoryKey: dto.memoryKey,
        content: dto.content,
        metadata: JSON.stringify(dto.metadata || {}),
        importance: dto.importance || 1,
      });

      const savedEntry = await this.memoryRepo.save(memoryEntry);

      // 同步到ChromaDB
      await this.chromaDbService.addDocument('memory_entries', savedEntry.id, savedEntry.content, {
        brandId: savedEntry.brandId,
        memoryType: savedEntry.memoryType,
        memoryKey: savedEntry.memoryKey,
        importance: savedEntry.importance,
      });

      return savedEntry;
    } catch (error) {
      this.logger.error('创建记忆条目失败:', error);
      throw error;
    }
  }

  async getMemoryEntries(
    brandId?: string,
    memoryType?: string,
    importance?: number,
  ) {
    try {
      const query = this.memoryRepo.createQueryBuilder('memory');

      if (brandId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(brandId)) {
          query.where('memory.brandId = :brandId', { brandId });
        }
      }

      if (memoryType) {
        query.andWhere('memory.memoryType = :memoryType', { memoryType });
      }

      if (importance) {
        query.andWhere('memory.importance = :importance', { importance });
      }

      query.orderBy('memory.importance', 'DESC');
      query.addOrderBy('memory.lastAccessedAt', 'DESC');
      query.addOrderBy('memory.createdAt', 'DESC');

      return await query.getMany();
    } catch (error) {
      this.logger.error('获取记忆条目列表失败:', error);
      throw error;
    }
  }

  async getMemoryEntryById(id: string) {
    try {
      const memoryEntry = await this.memoryRepo.findOne({ where: { id } });
      if (!memoryEntry) {
        throw new NotFoundException('记忆条目不存在');
      }

      memoryEntry.accessCount++;
      memoryEntry.lastAccessedAt = new Date();
      await this.memoryRepo.save(memoryEntry);

      return memoryEntry;
    } catch (error) {
      this.logger.error('获取记忆条目详情失败:', error);
      throw error;
    }
  }

  async getMemoryEntryByKey(brandId: string, memoryKey: string) {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(brandId)) {
        throw new BadRequestException('无效的品牌ID');
      }

      const memoryEntry = await this.memoryRepo.findOne({
        where: {
          brandId,
          memoryKey,
        },
      });

      if (!memoryEntry) {
        throw new NotFoundException('记忆条目不存在');
      }

      memoryEntry.accessCount++;
      memoryEntry.lastAccessedAt = new Date();
      await this.memoryRepo.save(memoryEntry);

      return memoryEntry;
    } catch (error) {
      this.logger.error('根据键获取记忆条目失败:', error);
      throw error;
    }
  }

  async updateMemoryEntry(id: string, dto: {
    content?: string;
    metadata?: Record<string, any>;
    importance?: number;
  }) {
    try {
      const memoryEntry = await this.memoryRepo.findOne({ where: { id } });
      if (!memoryEntry) {
        throw new NotFoundException('记忆条目不存在');
      }

      if (dto.importance && (dto.importance < 1 || dto.importance > 5)) {
        throw new BadRequestException('重要性级别必须在1-5之间');
      }

      if (dto.content !== undefined) {
        memoryEntry.content = dto.content;
      }
      if (dto.metadata !== undefined) {
        memoryEntry.metadata = JSON.stringify(dto.metadata);
      }
      if (dto.importance !== undefined) {
        memoryEntry.importance = dto.importance;
      }

      const updatedEntry = await this.memoryRepo.save(memoryEntry);

      // 同步到ChromaDB
      await this.chromaDbService.updateDocument('memory_entries', updatedEntry.id, updatedEntry.content, {
        brandId: updatedEntry.brandId,
        memoryType: updatedEntry.memoryType,
        memoryKey: updatedEntry.memoryKey,
        importance: updatedEntry.importance,
      });

      return updatedEntry;
    } catch (error) {
      this.logger.error('更新记忆条目失败:', error);
      throw error;
    }
  }

  async deleteMemoryEntry(id: string) {
    try {
      const memoryEntry = await this.memoryRepo.findOne({ where: { id } });
      if (!memoryEntry) {
        throw new NotFoundException('记忆条目不存在');
      }

      await this.memoryRepo.remove(memoryEntry);
      
      // 从ChromaDB删除
      await this.chromaDbService.deleteDocument('memory_entries', id);

      return { success: true, message: '记忆条目删除成功' };
    } catch (error) {
      this.logger.error('删除记忆条目失败:', error);
      throw error;
    }
  }

  async getMemoryStatistics(brandId: string) {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(brandId)) {
        return {
          total: 0,
          byType: {},
          byImportance: {},
          mostAccessed: [],
        };
      }

      const total = await this.memoryRepo.count({ where: { brandId } });

      const typeResult = await this.memoryRepo
        .createQueryBuilder('memory')
        .select('memory.memoryType, COUNT(*) as count')
        .where('memory.brandId = :brandId', { brandId })
        .groupBy('memory.memoryType')
        .getRawMany();

      const byType: Record<string, number> = {};
      typeResult.forEach(item => {
        byType[item.memoryType] = parseInt(item.count, 10);
      });

      const importanceResult = await this.memoryRepo
        .createQueryBuilder('memory')
        .select('memory.importance, COUNT(*) as count')
        .where('memory.brandId = :brandId', { brandId })
        .groupBy('memory.importance')
        .getRawMany();

      const byImportance: Record<string, number> = {};
      importanceResult.forEach(item => {
        byImportance[item.importance] = parseInt(item.count, 10);
      });

      const mostAccessed = await this.memoryRepo
        .createQueryBuilder('memory')
        .where('memory.brandId = :brandId', { brandId })
        .orderBy('memory.accessCount', 'DESC')
        .limit(5)
        .getMany();

      return {
        total,
        byType,
        byImportance,
        mostAccessed: mostAccessed.map(item => ({
          id: item.id,
          memoryKey: item.memoryKey,
          memoryType: item.memoryType,
          accessCount: item.accessCount,
        })),
      };
    } catch (error) {
      this.logger.error('获取记忆统计信息失败:', error);
      throw error;
    }
  }

  async searchSimilarMemories(
    brandId: string,
    query: string,
    limit: number = 5,
  ): Promise<Array<{ id: string; score: number; memoryKey: string; memoryType: string }>> {
    try {
      const results = await this.chromaDbService.querySimilar(
        'memory_entries',
        query,
        limit,
        { brandId },
      );

      const memoryEntries = await this.memoryRepo.findByIds(
        results.map(r => r.id),
      );

      const memoryMap = new Map(memoryEntries.map(m => [m.id, m]));

      return results.map(result => {
        const memory = memoryMap.get(result.id);
        return {
          id: result.id,
          score: result.score,
          memoryKey: memory?.memoryKey || '',
          memoryType: memory?.memoryType || '',
        };
      });
    } catch (error) {
      this.logger.error('搜索相似记忆失败:', error);
      return [];
    }
  }
}
