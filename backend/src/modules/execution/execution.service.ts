import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedContent } from '../../entities/generated-content.entity';
import { ComplianceCheck } from '../../entities/compliance-check.entity';

@Injectable()
export class ExecutionService {
  constructor(
    @InjectRepository(GeneratedContent)
    private contentRepo: Repository<GeneratedContent>,
    @InjectRepository(ComplianceCheck)
    private complianceRepo: Repository<ComplianceCheck>
  ) {}

  async deployContent(contentId: string) {
    const content = await this.contentRepo.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    const complianceChecks = await this.complianceRepo.find({
      where: { contentId },
    });

    const hasComplianceIssues = complianceChecks.some(
      (check) => !check.isCompliant
    );

    if (hasComplianceIssues) {
      throw new Error('内容存在合规问题，无法部署');
    }

    content.deploymentStatus = 'deployed';
    content.deployedAt = new Date();

    return await this.contentRepo.save(content);
  }

  async batchDeployContent(contentIds: string[]) {
    const results: Array<{
      success: boolean;
      contentId: string;
      deployedContent?: GeneratedContent;
      error?: string;
    }> = [];

    for (const contentId of contentIds) {
      try {
        const deployedContent = await this.deployContent(contentId);
        results.push({ success: true, contentId, deployedContent });
      } catch (error: any) {
        results.push({ success: false, contentId, error: error.message });
      }
    }

    return results;
  }

  async updateDeploymentStatus(contentId: string, status: string) {
    const content = await this.contentRepo.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    content.deploymentStatus = status;

    if (status === 'deployed' && !content.deployedAt) {
      content.deployedAt = new Date();
    }

    return await this.contentRepo.save(content);
  }

  async getDeploymentStatistics(brandId: string) {
    const totalContent = await this.contentRepo.count({
      where: { brandId },
    });

    const deployedContent = await this.contentRepo.count({
      where: { brandId, deploymentStatus: 'deployed' },
    });

    const draftContent = await this.contentRepo.count({
      where: { brandId, deploymentStatus: 'draft' },
    });

    const archivedContent = await this.contentRepo.count({
      where: { brandId, deploymentStatus: 'archived' },
    });

    return {
      total: totalContent,
      deployed: deployedContent,
      draft: draftContent,
      archived: archivedContent,
      deploymentRate: totalContent > 0 ? (deployedContent / totalContent) * 100 : 0,
    };
  }

  async getDeploymentHistory(contentId: string) {
    const content = await this.contentRepo.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    return {
      contentId: content.id,
      contentTitle: content.contentTitle,
      deploymentStatus: content.deploymentStatus,
      deployedAt: content.deployedAt,
      created_at: content.createdAt,
    };
  }
}
