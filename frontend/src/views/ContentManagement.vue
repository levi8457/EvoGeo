<template>
  <div class="content-management">
    <h1 class="page-title">内容管理</h1>

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

    <!-- 筛选条件 -->
    <div class="filter-container">
      <el-select v-model="filters.contentType" placeholder="内容类型" @change="loadContents">
        <el-option label="全部" value="" />
        <el-option label="文章" value="article" />
        <el-option label="社交媒体" value="social_media" />
        <el-option label="广告" value="advertisement" />
        <el-option label="其他" value="other" />
      </el-select>

      <el-select v-model="filters.platform" placeholder="平台" @change="loadContents">
        <el-option label="全部" value="" />
        <el-option label="微信" value="wechat" />
        <el-option label="微博" value="weibo" />
        <el-option label="抖音" value="douyin" />
        <el-option label="小红书" value="xiaohongshu" />
      </el-select>

      <el-select v-model="filters.status" placeholder="状态" @change="loadContents">
        <el-option label="全部" value="" />
        <el-option label="已生成" value="generated" />
        <el-option label="已发布" value="published" />
        <el-option label="已归档" value="archived" />
      </el-select>
    </div>

    <!-- 生成内容按钮 -->
    <div class="action-buttons">
      <el-button type="primary" @click="showGenerateDialog = true">
        <el-icon><Plus /></el-icon> 生成内容
      </el-button>
    </div>

    <!-- 内容列表 -->
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

      <el-table :data="contents" style="width: 100%" stripe>
        <el-table-column prop="contentTitle" label="标题" min-width="200" />
        <el-table-column prop="contentType" label="类型" width="100" />
        <el-table-column prop="platform" label="平台" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag
              :type="
                scope.row.status === 'published' ? 'success' :
                scope.row.status === 'generated' ? 'info' : 'warning'
              "
            >
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="feedbackScore" label="评分" width="80" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewContent(scope.row.id)">
              查看
            </el-button>
            <el-button size="small" type="primary" @click="updateStatus(scope.row.id, 'published')" :disabled="scope.row.status === 'published'">
              发布
            </el-button>
            <el-button size="small" type="danger" @click="deleteContent(scope.row.id)">
              删除
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

    <!-- 生成内容对话框 -->
    <el-dialog
      v-model="showGenerateDialog"
      title="生成内容"
      width="500px"
    >
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="策略">
          <el-select v-model="generateForm.strategyId" placeholder="选择策略">
            <el-option
              v-for="strategy in strategies"
              :key="strategy.id"
              :label="strategy.strategyType"
              :value="strategy.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容类型">
          <el-select v-model="generateForm.contentType" placeholder="选择内容类型">
            <el-option label="文章" value="article" />
            <el-option label="社交媒体" value="social_media" />
            <el-option label="广告" value="advertisement" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="generateForm.platform" placeholder="选择平台">
            <el-option label="微信" value="wechat" />
            <el-option label="微博" value="weibo" />
            <el-option label="抖音" value="douyin" />
            <el-option label="小红书" value="xiaohongshu" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showGenerateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleGenerate">生成</el-button>
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
        <h2>{{ currentContent.contentTitle }}</h2>
        <div class="content-meta">
          <span>类型: {{ currentContent.contentType }}</span>
          <span>平台: {{ currentContent.platform }}</span>
          <span>状态: {{ currentContent.status }}</span>
          <span>创建时间: {{ currentContent.createdAt }}</span>
        </div>
        <div class="content-body">
          {{ currentContent.content }}
        </div>
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
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { GenerationService } from '../api/generation';
import { EvolutionService } from '../api/evolution';
import { perceptionApi } from '../api/perception';

// 响应式数据
const selectedBrand = ref('');
const brands = ref<Array<{id: string; name: string}>>([]);

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

// 策略列表
const strategies = ref<any[]>([]);

// 对话框状态
const showGenerateDialog = ref(false);
const showContentDialog = ref(false);

// 生成内容表单
const generateForm = ref({
  strategyId: '',
  contentType: '',
  platform: '',
});

// 当前查看的内容
const currentContent = ref<any>(null);

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

// 加载策略列表
const loadStrategies = async () => {
  if (!selectedBrand.value) return;

  try {
    const data = await EvolutionService.getStrategies(selectedBrand.value);
    strategies.value = data;
  } catch (error) {
    console.error('加载策略失败:', error);
  }
};

// 加载内容列表
const loadContents = async () => {
  if (!selectedBrand.value) return;

  try {
    const data = await GenerationService.getGeneratedContents({
      brandId: selectedBrand.value,
      contentType: filters.value.contentType,
      platform: filters.value.platform,
      status: filters.value.status,
    });

    let filteredData = data || [];
    if (searchKeyword.value) {
      filteredData = filteredData.filter((item: any) =>
        item.contentTitle?.includes(searchKeyword.value)
      );
    }

    total.value = filteredData.length;
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    contents.value = filteredData.slice(start, end);
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

// 生成内容
const handleGenerate = async () => {
  if (!selectedBrand.value || !generateForm.value.strategyId || !generateForm.value.contentType || !generateForm.value.platform) {
    ElMessage.error('请填写完整的生成信息');
    return;
  }

  try {
    await GenerationService.generateContent({
      brandId: selectedBrand.value,
      strategyId: generateForm.value.strategyId,
      contentType: generateForm.value.contentType,
      platform: generateForm.value.platform,
    });

    ElMessage.success('内容生成成功');
    showGenerateDialog.value = false;
    loadContents();
  } catch (error) {
    console.error('生成内容失败:', error);
    ElMessage.error('生成内容失败');
  }
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

// 更新内容状态
const updateStatus = async (id: string, status: string) => {
  try {
    await GenerationService.updateContentStatus(id, status);
    ElMessage.success('状态更新成功');
    loadContents();
  } catch (error) {
    console.error('更新状态失败:', error);
    ElMessage.error('更新状态失败');
  }
};

// 删除内容
const deleteContent = async (id: string) => {
  try {
    await GenerationService.deleteGeneratedContent(id);
    ElMessage.success('内容删除成功');
    loadContents();
  } catch (error) {
    console.error('删除内容失败:', error);
    ElMessage.error('删除内容失败');
  }
};

// 组件挂载时加载数据
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
  gap: 20px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
  flex-wrap: wrap;
}

.content-body {
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
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
    gap: 10px;
  }
}
</style>
