import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { ComplianceService } from './compliance.service';

@Controller('api/compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  /**
   * 执行合规检测
   * @param contentId 内容ID
   * @returns 检测结果
   */
  @Post('check/:contentId')
  async runComplianceCheck(@Param('contentId') contentId: string) {
    return this.complianceService.runComplianceCheck(contentId);
  }

  /**
   * 获取内容的合规检测结果
   * @param contentId 内容ID
   * @returns 检测结果列表
   */
  @Get('checks/:contentId')
  async getComplianceChecks(@Param('contentId') contentId: string) {
    return this.complianceService.getComplianceChecks(contentId);
  }

  /**
   * 获取合规检测统计信息
   * @param brandId 品牌ID
   * @returns 统计信息
   */
  @Get('statistics')
  async getComplianceStatistics(@Query('brandId') brandId: string) {
    return this.complianceService.getComplianceStatistics(brandId);
  }

  /**
   * 重新执行合规检测
   * @param contentId 内容ID
   * @returns 新的检测结果
   */
  @Post('recheck/:contentId')
  async reRunComplianceCheck(@Param('contentId') contentId: string) {
    return this.complianceService.reRunComplianceCheck(contentId);
  }
}
