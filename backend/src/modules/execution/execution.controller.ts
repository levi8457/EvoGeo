import { Controller, Post, Get, Put, Body, Query, Param } from '@nestjs/common';
import { ExecutionService } from './execution.service';

@Controller('api/execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  /**
   * 部署内容
   * @param contentId 内容ID
   * @returns 部署结果
   */
  @Post('deploy/:contentId')
  async deployContent(@Param('contentId') contentId: string) {
    return this.executionService.deployContent(contentId);
  }

  /**
   * 批量部署内容
   * @param body 包含内容ID列表的请求体
   * @returns 批量部署结果
   */
  @Post('deploy/batch')
  async batchDeployContent(@Body() body: { contentIds: string[] }) {
    return this.executionService.batchDeployContent(body.contentIds);
  }

  /**
   * 更新内容部署状态
   * @param contentId 内容ID
   * @param body 包含新状态的请求体
   * @returns 更新后的内容
   */
  @Put('status/:contentId')
  async updateDeploymentStatus(
    @Param('contentId') contentId: string,
    @Body() body: { status: string }
  ) {
    return this.executionService.updateDeploymentStatus(contentId, body.status);
  }

  /**
   * 获取部署统计信息
   * @param brandId 品牌ID
   * @returns 部署统计
   */
  @Get('statistics')
  async getDeploymentStatistics(@Query('brandId') brandId: string) {
    return this.executionService.getDeploymentStatistics(brandId);
  }

  /**
   * 获取内容部署历史
   * @param contentId 内容ID
   * @returns 部署历史
   */
  @Get('history/:contentId')
  async getDeploymentHistory(@Param('contentId') contentId: string) {
    return this.executionService.getDeploymentHistory(contentId);
  }
}
