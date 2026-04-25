<template>
  <div class="compliance-management">
    <h1 class="page-title">合规检测管理</h1>

    <!-- 品牌选择 -->
    <div class="brand-selector">
      <el-select v-model="selectedBrand" placeholder="选择品牌" @change="loadContents">
        <el-option
          v-for="brand in brands"
          :key="brand.id"
          :label="brand.name"
          :value="brand.id"
        />
      </el-select>
    </div>

    <!-- 内容列表 -->
    <el-card shadow="hover" class="content-list-card">
      <template #header>
        <div class="card-header">
          <span>待检测内容</span>
        </div>
      </template>

      <el-table :data="contents" style="width: 100%" stripe>
        <el-table-column prop="contentTitle" label="标题" min-width="200" />
        <el-table-column prop="contentType" label="类型" width="100" />
        <el-table-column prop="platform" label="平台" width="100" />
        <el-table-column label="合规状态" width="120">
          <template #default="scope">
            <el-tag
              :type="getComplianceStatusTagType(scope.row.complianceStatus)"
            >
              {{ scope.row.complianceStatus || '未检测' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewContent(scope.row.id)">
              查看
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="runComplianceCheck(scope.row.id)"
              :loading="checkingContentId === scope.row.id"
            >
              合规检测
            </el-button>
            <el-button size="small" @click="viewComplianceResult(scope.row.id)">
              检测结果
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 合规检测结果对话框 -->
    <el-dialog
      v-model="showComplianceDialog"
      title="合规检测结果"
      width="800px"
    >
      <div v-if="currentComplianceChecks.length > 0" class="compliance-results">
        <div
          v-for="check in currentComplianceChecks"
          :key="check.id"
          class="compliance-check-item"
          :class="{ 'non-compliant': !check.isCompliant }"
        >
          <div class="check-header">
            <span class="check-type">{{ getCheckTypeName(check.checkType) }}</span>
            <el-tag :type="check.isCompliant ? 'success' : 'danger'">
              {{ check.isCompliant ? '通过' : '不通过' }}
            </el-tag>
          </div>
          <div class="check-risk">
            <span>风险等级：</span>
            <el-tag :type="getRiskLevelTagType(check.riskLevel)">
              {{ check.riskLevel }}
            </el-tag>
          </div>
          <div v-if="check.issues && check.issues.length > 0" class="check-issues">
            <h4>问题：</h4>
            <ul>
              <li v-for="(issue, index) in check.issues" :key="index">
                {{ issue }}
              </li>
            </ul>
          </div>
          <div v-if="check.suggestions" class="check-suggestions">
            <h4>建议：</h4>
            <p>{{ check.suggestions }}</p>
          </div>
        </div>
      </div>
      <div v-else>
        <el-empty description="暂无检测结果" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showComplianceDialog = false">关闭</el-button>
          <el-button type="primary" @click="reRunComplianceCheck">重新检测</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 内容详情对话框 -->
    <el-dialog
      v-model="showContentDialog"
      title="内容详情"
      width="800px"
    >
      <div v-if="currentContent" class="content-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题" :span="2">{{ currentContent.contentTitle }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentContent.contentType }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ currentContent.platform }}</el-descriptions-item>
          <el-descriptions-item label="品牌">{{ currentContent.brandName }}</el-descriptions-item>
          <el-descriptions-item label="合规状态">
            <el-tag :type="getComplianceStatusTagType(currentContent.complianceStatus)">
              {{ currentContent.complianceStatus || '未检测' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentContent.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">
            <div class="content-text">{{ currentContent.contentText || currentContent.generatedContent }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showContentDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElEmpty } from 'element-plus';
import { GenerationService } from '../api/generation';
import { ComplianceService } from '../api/compliance';
import { perceptionApi } from '../api/perception';

// 响应式数据
const selectedBrand = ref('');
const brands = ref<Array<{id: string; name: string}>>([]);

const contents = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const checkingContentId = ref('');

// 对话框状态
const showComplianceDialog = ref(false);
const showContentDialog = ref(false);
const currentContentId = ref('');
const currentContent = ref<any>(null);
const currentComplianceChecks = ref<any[]>([]);

// 加载品牌
const loadBrands = async () => {
  try {
    const data = await perceptionApi.getBrands();
    brands.value = data || [];
    if (brands.value.length > 0 && !selectedBrand.value) {
      selectedBrand.value = brands.value[0].id;
    }
  } catch (error) {
    console.error('加载品牌失败:', error);
  }
};

// 加载内容列表
const loadContents = async () => {
  if (!selectedBrand.value) return;

  try {
    const data = await GenerationService.getGeneratedContents({
      brandId: selectedBrand.value,
    });

    total.value = data.length;
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    contents.value = data.slice(start, end);
  } catch (error) {
    console.error('加载内容列表失败:', error);
  }
};

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  loadContents();
};

// 处理当前页变化
const handleCurrentChange = (current: number) => {
  currentPage.value = current;
  loadContents();
};

// 查看内容详情
const viewContent = async (id: string) => {
  try {
    const content = await GenerationService.getGeneratedContentById(id);
    currentContent.value = content;
    showContentDialog.value = true;
  } catch (error) {
    console.error('获取内容详情失败:', error);
    ElMessage.error('获取内容详情失败');
  }
};

// 执行合规检测
const runComplianceCheck = async (contentId: string) => {
  try {
    checkingContentId.value = contentId;
    await ComplianceService.runComplianceCheck(contentId);
    ElMessage.success('合规检测已完成');

    let pollCount = 0;
    const maxPolls = 5;
    const pollComplianceStatus = async () => {
      if (pollCount >= maxPolls) {
        checkingContentId.value = '';
        return;
      }
      pollCount++;
      const updatedContent = await GenerationService.getGeneratedContentById(contentId);
      const index = contents.value.findIndex(c => c.id === contentId);
      if (index !== -1) {
        contents.value[index] = updatedContent;
      }
      if (updatedContent.complianceStatus === 'passed' || updatedContent.complianceStatus === 'failed') {
        checkingContentId.value = '';
        return;
      }
      setTimeout(pollComplianceStatus, 2000);
    };
    await pollComplianceStatus();
    await viewComplianceResult(contentId);
  } catch (error) {
    console.error('执行合规检测失败:', error);
    checkingContentId.value = '';
    ElMessage.error('执行合规检测失败');
  }
};

// 查看合规检测结果
const viewComplianceResult = async (contentId: string) => {
  try {
    const checks = await ComplianceService.getComplianceChecks(contentId);
    currentContentId.value = contentId;
    currentComplianceChecks.value = checks;
    showComplianceDialog.value = true;
  } catch (error) {
    console.error('获取合规检测结果失败:', error);
    ElMessage.error('获取合规检测结果失败');
  }
};

// 重新执行合规检测
const reRunComplianceCheck = async () => {
  if (!currentContentId.value) return;

  try {
    const checks = await ComplianceService.reRunComplianceCheck(currentContentId.value);
    currentComplianceChecks.value = checks;
    ElMessage.success('重新检测已完成');
  } catch (error) {
    console.error('重新执行合规检测失败:', error);
    ElMessage.error('重新执行合规检测失败');
  }
};

// 获取合规状态标签类型
const getComplianceStatusTagType = (status: string) => {
  switch (status) {
    case '通过':
      return 'success';
    case '不通过':
      return 'danger';
    case '检测中':
      return 'warning';
    default:
      return 'info';
  }
};

// 获取风险等级标签类型
const getRiskLevelTagType = (level: string) => {
  switch (level) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'danger';
    default:
      return 'info';
  }
};

// 获取检测类型名称
const getCheckTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    sensitive_content: '敏感内容检测',
    copyright: '版权检测',
    legal_compliance: '法律合规检测',
    brand_guidelines: '品牌指南检测',
  };
  return typeMap[type] || type;
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadBrands();
  await loadContents();
});
</script>

<style scoped>
.compliance-management {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 100px);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 30px;
  color: #333;
}

.brand-selector {
  margin-bottom: 20px;
}

.content-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.compliance-results {
  max-height: 500px;
  overflow-y: auto;
}

.compliance-check-item {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
}

.compliance-check-item.non-compliant {
  border-left: 4px solid #f56c6c;
}

.check-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.check-type {
  font-weight: 600;
  font-size: 16px;
}

.check-risk {
  margin-bottom: 10px;
}

.check-issues {
  margin-bottom: 10px;
}

.check-issues ul {
  margin-top: 5px;
  padding-left: 20px;
}

.check-issues li {
  margin-bottom: 5px;
  color: #f56c6c;
}

.check-suggestions {
  margin-top: 10px;
}

.check-suggestions p {
  margin-top: 5px;
  color: #67c23a;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.content-detail {
  padding: 10px;
}

.content-text {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
