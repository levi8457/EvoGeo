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
import { GenerationService } from './generation.service';

@Controller('api/generation')
export class GenerationController {
  constructor(private generationService: GenerationService) {}

  /**
   * 生成内容
   * POST /api/generation/content
   */
  @Post('content')
  @HttpCode(HttpStatus.CREATED)
  async generateContent(@Body() dto: {
    brandId: string;
    strategyId: string;
    contentType: string;
    platform: string;
    parameters?: Record<string, any>;
  }) {
    return this.generationService.generateContent(dto);
  }

  /**
   * 获取生成内容列表
   * GET /api/generation/contents
   */
  @Get('contents')
  async getGeneratedContents(
    @Query('brandId') brandId?: string,
    @Query('contentType') contentType?: string,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
  ) {
    return this.generationService.getGeneratedContents(brandId, contentType, platform, status);
  }

  /**
   * 获取生成内容详情
   * GET /api/generation/contents/:id
   */
  @Get('contents/:id')
  async getGeneratedContentById(@Param('id') id: string) {
    return this.generationService.getGeneratedContentById(id);
  }

  /**
   * 更新内容状态
   * PUT /api/generation/contents/:id/status
   */
  @Put('contents/:id/status')
  async updateContentStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.generationService.updateContentStatus(id, status);
  }

  /**
   * 删除生成内容
   * DELETE /api/generation/contents/:id
   */
  @Delete('contents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGeneratedContent(@Param('id') id: string) {
    return this.generationService.deleteGeneratedContent(id);
  }

  /**
   * 获取内容统计信息
   * GET /api/generation/statistics
   */
  @Get('statistics')
  async getContentStatistics(@Query('brandId') brandId: string) {
    return this.generationService.getContentStatistics(brandId);
  }
}
