import { Controller, Get, Post, Put, Delete, Query, Body, HttpException, HttpStatus, Param } from '@nestjs/common';
import { PerceptionService } from './perception.service';
import { AiPlatformService } from './ai-platform.service';
import { DashboardResponse } from './perception.types';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsBoolean, Matches } from 'class-validator';

class DashboardFiltersDto {
  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  platforms?: string[];
}

class RunCheckDto {
  @IsString()
  @IsNotEmpty()
  queryId: string;

  @IsString({ each: true })
  platforms: string[];
}

class ScanBrandDto {
  @IsString()
  @IsNotEmpty()
  brandName: string;

  @IsString()
  @IsNotEmpty()
  query: string;
}

class CreateQueryDto {
  @IsString()
  @IsNotEmpty({ message: '品牌ID不能为空' })
  brandId: string;

  @IsString()
  @IsNotEmpty({ message: '查询文本不能为空' })
  @Matches(/\S/, { message: '查询文本不能为纯空格' })
  queryText: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;
}

class UpdateQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: '查询文本不能为纯空格' })
  queryText?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('api/perception')
export class PerceptionController {
  constructor(
    private readonly perceptionService: PerceptionService,
    private readonly aiPlatformService: AiPlatformService,
  ) {}

  @Get('dashboard')
  async getDashboardData(@Query() filters: DashboardFiltersDto): Promise<DashboardResponse> {
    return this.perceptionService.getDashboardData(filters);
  }

  @Get('brands')
  async getBrands() {
    return this.perceptionService.getAllBrands();
  }

  @Get('queries')
  async getQueries(@Query('brandId') brandId?: string) {
    return this.perceptionService.getQueries(brandId);
  }

  @Post('queries')
  async createQuery(@Body() dto: CreateQueryDto) {
    return this.perceptionService.createQuery(dto);
  }

  @Get('queries/:id')
  async getQuery(@Param('id') id: string) {
    return this.perceptionService.getQueryById(id);
  }

  @Put('queries/:id')
  async updateQuery(@Param('id') id: string, @Body() dto: UpdateQueryDto) {
    return this.perceptionService.updateQuery(id, dto);
  }

  @Delete('queries/:id')
  async deleteQuery(@Param('id') id: string) {
    return this.perceptionService.deleteQuery(id);
  }

  @Get('visibility-records')
  async getVisibilityRecords(
    @Query('brandId') brandId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.perceptionService.getVisibilityRecords(brandId, startDate, endDate);
  }

  @Post('run-check')
  async runImmediateCheck(@Body() dto: RunCheckDto) {
    return this.perceptionService.runImmediateCheck(dto.queryId, dto.platforms);
  }

  @Get('competitor-analysis')
  async getCompetitorAnalysis(
    @Query('brandId') brandId: string,
    @Query('queryId') queryId?: string,
  ) {
    return this.perceptionService.getCompetitorAnalysis(brandId, queryId);
  }

  @Get('platforms')
  async getSupportedPlatforms() {
    return {
      platforms: await this.aiPlatformService.getSupportedPlatforms(),
    };
  }

  @Get('platforms/enabled')
  async getEnabledPlatforms() {
    return this.aiPlatformService.getEnabledPlatforms();
  }

  @Get('platforms/:name/test')
  async testPlatformConnection(@Param('name') name: string) {
    return this.aiPlatformService.testPlatformConnection(name);
  }

  @Get('test-llm')
  async testDeepSeekAPI() {
    return this.perceptionService.testDeepSeekAPI();
  }

  @Post('scan')
  async scanBrand(@Body() body: ScanBrandDto) {
    try {
      return await this.perceptionService.analyzeBrandVisibility(body.brandName, body.query);
    } catch (error) {
      console.error('[手动扫描失败]:', error.message || error);
      throw new HttpException(error.message || '大模型请求失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('seed-history')
  async seedHistory() {
    await this.perceptionService.seedHistoricalData();
    return { message: '历史数据生成成功！请刷新前端大屏。' };
  }
}
