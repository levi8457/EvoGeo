<template>
  <div class="content-management">
    <h1 class="page-title">内容管理</h1>

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

    <div class="filter-container">
      <el-select v-model="filters.contentType" placeholder="内容类型" @change="loadContents">
        <el-option label="全部" value="" />
        <el-option label="文章" value="article" />
        <el-option label="社交媒体" value="social_media" />
        <el-option label="广告" value="advertisement" />
        <el-option label="博客" value="blog" />
        <el-option label="产品描述" value="product_description" />
        <el-option label="邮件" value="email" />
        <el-option label="其他" value="other" />
      </el-select>

      <el-select v-model="filters.platform" placeholder="AI平台" @change="loadContents">
        <el-option label="全部" value="" />
        <el-option label="DeepSeek" value="deepseek" />
        <el-option label="ChatGPT" value="chatgpt" />
        <el-option label="Kimi" value="kimi" />
        <el-option label="文心一言" value="wenxin" />
        <el-option label="通义千问" value="tongyi" />
      </el-select>

      <el-select v-model="filters.status" placeholder="状态" @change="loadContents">
        <el-option label="全部" value="" />
        <el-option label="已生成" value="generated" />
        <el-option label="已发布" value="published" />
        <el-option label="已归档" value="archived" />
      </el-select>
    </div>

    <div class="action-buttons">
      <el-button type="primary" @click="showGenerateDialog = true">
        <el-icon><Plus /></el-icon> 生成内容
      </el-button>
    </div>

    <el-card shadow="hover" class="content-list-card">
      <template #header>
        <div class="card-header">
          <span>内容列表</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索内容标题"
            style="width: 200px"
            @input="loadContents"
          />
        </div>
      </template>

      <el-table :data="contents" style="width: 100%" stripe v-loading="loading">
        <el-table-column prop="contentTitle" label="标题" min-width="200" />
        <el-table-column prop="contentType" label="类型" width="120">
          <template #default="scope">
            <el-tag :type="getContentTypeTag(scope.row.contentType)">
              {{ getContentTypeLabel(scope.row.contentType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="platform" label="AI平台" width="100">
          <template #default="scope">
            {{ getPlatformLabel(scope.row.platform) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewContent(scope.row.id)">查看</el-button>
            <el-button
              size="small"
              type="success"
              @click="deployContent(scope.row.id)"
              :disabled="scope.row.deploymentStatus === 'deployed'"
            >
              部署
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="archiveContent(scope.row.id)"
              :disabled="scope.row.status === 'archived'"
            >
              归档
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="updateStatus(scope.row.id, 'published')"
              :disabled="scope.row.status === 'published'"
            >
              发布
            </el-button>
            <el-button size="small" type="danger" @click="deleteContent(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <el-dialog v-model="showGenerateDialog" title="生成内容" width="600px">
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="策略" required>
          <el-select v-model="generateForm.strategyId" placeholder="选择策略">
            <el-option
              v-for="strategy in strategies"
              :key="strategy.id"
              :label="getStrategyLabel(strategy)"
              :value="strategy.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="内容类型" required>
          <el-select v-model="generateForm.contentType" placeholder="选择内容类型">
            <el-option label="文章" value="article" />
            <el-option label="社交媒体" value="social_media" />
            <el-option label="广告" value="advertisement" />
            <el-option label="博客" value="blog" />
            <el-option label="产品描述" value="product_description" />
            <el-option label="邮件" value="email" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="AI平台" required>
          <el-select v-model="generateForm.platform" placeholder="选择AI平台">
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="ChatGPT" value="chatgpt" />
            <el-option label="Kimi" value="kimi" />
            <el-option label="文心一言" value="wenxin" />
            <el-option label="通义千问" value="tongyi" />
          </el-select>
        </el-form-item>

        <el-form-item label="内容长度">
          <el-input :value="getContentLength(generateForm.contentType)" disabled />
        </el-form-item>

        <el-form-item label="提示词预览">
          <el-input
            :value="getPromptPreview(generateForm.contentType)"
            type="textarea"
            :rows="3"
            disabled
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showGenerateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleGenerate" :loading="generating">生成</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showContentDialog" title="内容详情" width="800px">
      <div v-if="currentContent" class="content-detail">
        <h2>{{ currentContent.contentTitle }}</h2>
        <div class="content-meta">
          <el-tag>{{ getContentTypeLabel(currentContent.contentType) }}</el-tag>
          <el-tag type="success">{{ getPlatformLabel(currentContent.platform) }}</el-tag>
          <el-tag :type="currentContent.status === 'published' ? 'success' : 'info'">
            {{ getStatusLabel(currentContent.status) }}
          </el-tag>
          <span class="create-time">创建时间: {{ currentContent.createdAt }}</span>
        </div>
        <el-divider />
        <div class="content-body">
          {{ currentContent.content }}
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="copyContent" type="primary">复制内容</el-button>
          <el-button @click="showContentDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { GenerationService } from '../api/generation';
import { EvolutionService } from '../api/evolution';
import { perceptionApi } from '../api/perception';

const selectedBrand = ref('');
const brands = ref<Array<{id: string; name: string}>>([]);
const loading = ref(false);
const generating = ref(false);

const filters = ref({
  contentType: '',
  platform: '',
  status: '',
});

const searchKeyword = ref('');
const contents = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const strategies = ref<any[]>([]);

const showGenerateDialog = ref(false);
const showContentDialog = ref(false);

const generateForm = ref({
  strategyId: '',
  contentType: 'article',
  platform: 'deepseek',
});

const currentContent = ref<any>(null);

const contentTypeInfo: Record<string, { label: string; length: string; prompt: string }> = {
  article: {
    label: '文章',
    length: '800-1000字',
    prompt: '请为品牌撰写一篇专业的文章内容包括品牌定位、核心优势和市场竞争分析',
  },
  social_media: {
    label: '社交媒体',
    length: '100-200字',
    prompt: '请撰写一条适合社交媒体平台的推广文案，突出品牌特色',
  },
  advertisement: {
    label: '广告',
    length: '50-100字',
    prompt: '请撰写一段吸引人的广告文案，突出品牌价值和产品特点',
  },
  blog: {
    label: '博客',
    length: '600-800字',
    prompt: '请撰写一篇博客文章，分享品牌相关的专业知识或行业洞察',
  },
  product_description: {
    label: '产品描述',
    length: '200-400字',
    prompt: '请撰写一段产品描述，突出产品功能特性和使用场景',
  },
  email: {
    label: '邮件',
    length: '300-500字',
    prompt: '请撰写一封品牌推广邮件，包含开场白、产品介绍和号召行动',
  },
};

const platformLabels: Record<string, string> = {
  deepseek: 'DeepSeek',
  chatgpt: 'ChatGPT',
  kimi: 'Kimi',
  wenxin: '文心一言',
  tongyi: '通义千问',
};

const getContentLength = (contentType: string) => {
  return contentTypeInfo[contentType]?.length || '';
};

const getPromptPreview = (contentType: string) => {
  return contentTypeInfo[contentType]?.prompt || '';
};

const getContentTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    article: '',
    social_media: 'success',
    advertisement: 'warning',
    blog: 'info',
    product_description: 'danger',
    email: '',
  };
  return tags[type] || 'info';
};

const getContentTypeLabel = (type: string) => {
  return contentTypeInfo[type]?.label || type;
};

const getPlatformLabel = (platform: string) => {
  return platformLabels[platform] || platform;
};

const getStatusTag = (status: string) => {
  const tags: Record<string, string> = {
    generated: 'info',
    published: 'success',
    archived: 'warning',
  };
  return tags[status] || 'info';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    generated: '已生成',
    published: '已发布',
    archived: '已归档',
  };
  return labels[status] || status;
};

const getStrategyLabel = (strategy: any) => {
  return strategy.contentTemplate?.substring(0, 50) + (strategy.contentTemplate?.length > 50 ? '...' : '');
};

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

const loadStrategies = async () => {
  if (!selectedBrand.value) return;

  try {
    const data = await EvolutionService.getStrategies(selectedBrand.value);
    strategies.value = data || [];
  } catch (error) {
    console.error('加载策略失败:', error);
  }
};

const loadContents = async () => {
  if (!selectedBrand.value) return;

  loading.value = true;
  try {
    const data = await GenerationService.getGeneratedContents({
      brandId: selectedBrand.value,
      contentType: filters.value.contentType,
      platform: filters.value.platform,
      status: filters.value.status,
    });

    let filteredData = data || [];
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      filteredData = filteredData.filter((item: any) =>
        item.contentTitle?.toLowerCase().includes(keyword)
      );
    }

    total.value = filteredData.length;
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    contents.value = filteredData.slice(start, end);
  } catch (error) {
    console.error('加载内容列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  loadContents();
};

const handleCurrentChange = (current: number) => {
  currentPage.value = current;
  loadContents();
};

const handleGenerate = async () => {
  if (!selectedBrand.value) {
    ElMessage.error('请先选择品牌');
    return;
  }

  if (!generateForm.value.strategyId) {
    ElMessage.error('请选择策略');
    return;
  }

  if (!generateForm.value.contentType) {
    ElMessage.error('请选择内容类型');
    return;
  }

  if (!generateForm.value.platform) {
    ElMessage.error('请选择AI平台');
    return;
  }

  generating.value = true;
  try {
    await GenerationService.generateContent({
      brandId: selectedBrand.value,
      strategyId: generateForm.value.strategyId,
      contentType: generateForm.value.contentType,
      platform: generateForm.value.platform,
    });

    ElMessage.success('内容生成成功');
    showGenerateDialog.value = false;
    await loadContents();
  } catch (error: any) {
    console.error('生成内容失败:', error);
    const errorMessage = error.response?.data?.message || error.message || '生成内容失败';
    ElMessage.error(`生成内容失败: ${errorMessage}`);
  } finally {
    generating.value = false;
  }
};

const viewContent = async (id: string) => {
  try {
    const content = await GenerationService.getGeneratedContentById(id);
    currentContent.value = content;
    showContentDialog.value = true;
  } catch (error: any) {
    console.error('获取内容详情失败:', error);
    const errorMessage = error.response?.data?.message || error.message || '获取内容详情失败';
    ElMessage.error(`获取内容详情失败: ${errorMessage}`);
  }
};

const copyContent = async () => {
  if (currentContent.value?.content) {
    try {
      await navigator.clipboard.writeText(currentContent.value.content);
      ElMessage.success('内容已复制到剪贴板');
    } catch (error) {
      ElMessage.error('复制失败');
    }
  }
};

const updateStatus = async (id: string, status: string) => {
  try {
    await GenerationService.updateContentStatus(id, status);
    ElMessage.success('状态更新成功');
    loadContents();
  } catch (error: any) {
    console.error('更新状态失败:', error);
    const errorMessage = error.response?.data?.message || error.message || '更新状态失败';
    ElMessage.error(`更新状态失败: ${errorMessage}`);
  }
};

const deployContent = async (id: string) => {
  try {
    await GenerationService.deployContent(id);
    ElMessage.success('内容部署成功');
    loadContents();
  } catch (error: any) {
    console.error('部署内容失败:', error);
    const errorMessage = error.response?.data?.message || error.message || '部署内容失败';
    ElMessage.error(`部署内容失败: ${errorMessage}`);
  }
};

const archiveContent = async (id: string) => {
  try {
    await GenerationService.archiveContent(id);
    ElMessage.success('内容归档成功');
    loadContents();
  } catch (error: any) {
    console.error('归档内容失败:', error);
    const errorMessage = error.response?.data?.message || error.message || '归档内容失败';
    ElMessage.error(`归档内容失败: ${errorMessage}`);
  }
};

const deleteContent = async (id: string) => {
  try {
    await GenerationService.deleteGeneratedContent(id);
    ElMessage.success('内容删除成功');
    loadContents();
  } catch (error: any) {
    console.error('删除内容失败:', error);
    const errorMessage = error.response?.data?.message || error.message || '删除内容失败';
    ElMessage.error(`删除内容失败: ${errorMessage}`);
  }
};

onMounted(async () => {
  await loadBrands();
  await loadStrategies();
  await loadContents();
});
</script>

<style scoped>
.content-management {
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

.filter-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.action-buttons {
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

.content-detail {
  padding: 20px;
}

.content-detail h2 {
  margin-bottom: 20px;
  color: #333;
}

.content-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.create-time {
  color: #999;
  font-size: 14px;
}

.content-body {
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  font-size: 15px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .filter-container {
    flex-direction: column;
  }

  .content-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>