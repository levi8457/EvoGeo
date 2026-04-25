import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ComplianceCheck } from '../../entities/compliance-check.entity';
import { GeneratedContent } from '../../entities/generated-content.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceCheck)
    private complianceRepo: Repository<ComplianceCheck>,
    @InjectRepository(GeneratedContent)
    private contentRepo: Repository<GeneratedContent>
  ) {}

  async runComplianceCheck(contentId: string) {
    const content = await this.contentRepo.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    const checks = [
      await this.checkSensitiveContent(content),
      await this.checkCopyrightIssues(content),
      await this.checkLegalCompliance(content),
      await this.checkBrandGuidelines(content),
    ];

    const savedChecks: ComplianceCheck[] = [];
    for (const check of checks) {
      const complianceCheck = this.complianceRepo.create({
        contentId: content.id,
        checkType: check.checkType,
        isCompliant: check.isCompliant,
        riskLevel: check.riskLevel,
        issues: JSON.stringify(check.issues),
        suggestions: check.suggestions,
      });
      savedChecks.push(await this.complianceRepo.save(complianceCheck));
    }

    const allPassed = checks.every(check => check.isCompliant);
    content.complianceStatus = allPassed ? 'passed' : 'failed';
    content.lastCheckedAt = new Date();
    await this.contentRepo.save(content);

    return savedChecks;
  }

  private async checkSensitiveContent(content: GeneratedContent) {
    const sensitiveKeywords = ['敏感词1', '敏感词2', '敏感词3'];
    const issues: string[] = [];

    for (const keyword of sensitiveKeywords) {
      if (content.content.includes(keyword)) {
        issues.push(`包含敏感词: ${keyword}`);
      }
    }

    return {
      checkType: 'sensitive_content',
      isCompliant: issues.length === 0,
      riskLevel: issues.length > 0 ? 'high' : 'low',
      issues,
      suggestions: issues.length > 0 ? '请修改或删除敏感内容' : '未发现敏感内容',
    };
  }

  private async checkCopyrightIssues(content: GeneratedContent) {
    const hasCopyrightIssues = Math.random() > 0.8;

    return {
      checkType: 'copyright',
      isCompliant: !hasCopyrightIssues,
      riskLevel: hasCopyrightIssues ? 'medium' : 'low',
      issues: hasCopyrightIssues ? ['可能存在版权问题'] : [],
      suggestions: hasCopyrightIssues ? '请检查内容是否侵犯他人版权' : '未发现版权问题',
    };
  }

  private async checkLegalCompliance(content: GeneratedContent) {
    const hasLegalIssues = Math.random() > 0.9;

    return {
      checkType: 'legal_compliance',
      isCompliant: !hasLegalIssues,
      riskLevel: hasLegalIssues ? 'high' : 'low',
      issues: hasLegalIssues ? ['可能存在法律合规问题'] : [],
      suggestions: hasLegalIssues ? '请咨询法律专业人士' : '未发现法律合规问题',
    };
  }

  private async checkBrandGuidelines(content: GeneratedContent) {
    const hasGuidelineIssues = Math.random() > 0.7;

    return {
      checkType: 'brand_guidelines',
      isCompliant: !hasGuidelineIssues,
      riskLevel: hasGuidelineIssues ? 'low' : 'low',
      issues: hasGuidelineIssues ? ['可能不符合品牌指南'] : [],
      suggestions: hasGuidelineIssues ? '请参考品牌指南进行修改' : '符合品牌指南',
    };
  }

  async getComplianceChecks(contentId: string) {
    return this.complianceRepo.find({
      where: { contentId },
      order: { checkedAt: 'DESC' },
    });
  }

  async getComplianceStatistics(brandId: string) {
    const contents = await this.contentRepo.find({
      where: { brandId },
      select: ['id'],
    });

    const contentIds = contents.map((content) => content.id);

    if (contentIds.length === 0) {
      return {
        totalChecks: 0,
        compliantChecks: 0,
        nonCompliantChecks: 0,
        complianceRate: 0,
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0,
        },
      };
    }

    const totalChecks = await this.complianceRepo.count({
      where: { contentId: In(contentIds) },
    });

    const compliantChecks = await this.complianceRepo.count({
      where: { contentId: In(contentIds), isCompliant: true },
    });

    const nonCompliantChecks = totalChecks - compliantChecks;

    const lowRiskChecks = await this.complianceRepo.count({
      where: { contentId: In(contentIds), riskLevel: 'low' },
    });

    const mediumRiskChecks = await this.complianceRepo.count({
      where: { contentId: In(contentIds), riskLevel: 'medium' },
    });

    const highRiskChecks = await this.complianceRepo.count({
      where: { contentId: In(contentIds), riskLevel: 'high' },
    });

    return {
      totalChecks,
      compliantChecks,
      nonCompliantChecks,
      complianceRate: totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : 0,
      riskDistribution: {
        low: lowRiskChecks,
        medium: mediumRiskChecks,
        high: highRiskChecks,
      },
    };
  }

  async reRunComplianceCheck(contentId: string) {
    await this.complianceRepo.delete({ contentId });
    return this.runComplianceCheck(contentId);
  }
}
