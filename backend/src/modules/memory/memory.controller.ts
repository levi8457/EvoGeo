import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MemoryService } from './memory.service';

@Controller('api/memory')
export class MemoryController {
  constructor(private memoryService: MemoryService) {}

  /**
   * 创建记忆条目
   * POST /api/memory/entries
   */
  @Post('entries')
  @HttpCode(HttpStatus.CREATED)
  async createMemoryEntry(@Body() dto: {
    brandId: string;
    memoryType: string;
    memoryKey: string;
    content: string;
    metadata?: Record<string, any>;
    importance?: number;
  }) {
    return this.memoryService.createMemoryEntry(dto);
  }

  /**
   * 获取记忆条目列表
   * GET /api/memory/entries
   */
  @Get('entries')
  async getMemoryEntries(
    @Query('brandId') brandId?: string,
    @Query('memoryType') memoryType?: string,
    @Query('importance') importance?: number,
  ) {
    return this.memoryService.getMemoryEntries(brandId, memoryType, importance);
  }

  /**
   * 获取记忆条目详情
   * GET /api/memory/entries/:id
   */
  @Get('entries/:id')
  async getMemoryEntryById(@Param('id') id: string) {
    return this.memoryService.getMemoryEntryById(id);
  }

  /**
   * 根据键获取记忆条目
   * GET /api/memory/entries/by-key
   */
  @Get('entries/by-key')
  async getMemoryEntryByKey(
    @Query('brandId') brandId: string,
    @Query('memoryKey') memoryKey: string,
  ) {
    return this.memoryService.getMemoryEntryByKey(brandId, memoryKey);
  }

  /**
   * 更新记忆条目
   * PUT /api/memory/entries/:id
   */
  @Put('entries/:id')
  async updateMemoryEntry(
    @Param('id') id: string,
    @Body() dto: {
      content?: string;
      metadata?: Record<string, any>;
      importance?: number;
    },
  ) {
    return this.memoryService.updateMemoryEntry(id, dto);
  }

  /**
   * 删除记忆条目
   * DELETE /api/memory/entries/:id
   */
  @Delete('entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMemoryEntry(@Param('id') id: string) {
    return this.memoryService.deleteMemoryEntry(id);
  }

  /**
   * 获取记忆统计信息
   * GET /api/memory/statistics
   */
  @Get('statistics')
  async getMemoryStatistics(@Query('brandId') brandId: string) {
    return this.memoryService.getMemoryStatistics(brandId);
  }

  /**
   * 搜索相似记忆
   * GET /api/memory/search
   */
  @Get('search')
  async searchSimilarMemories(
    @Query('brandId') brandId: string,
    @Query('query') query: string,
    @Query('limit') limit: number = 5,
  ) {
    return this.memoryService.searchSimilarMemories(brandId, query, limit);
  }
}
