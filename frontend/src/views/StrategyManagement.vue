<template>
  <div class="strategy-management">
    <el-card class="page-header">
      <template #header>
        <div class="page-header-content">
          <h1>策略管理</h1>
          <div class="header-actions">
            <div class="filter-item">
              <span class="filter-label">品牌</span>
              <el-select v-model="selectedBrand" placeholder="选择品牌" @change="handleBrandChange">
                <el-option
                  v-for="brand in brands"
                  :key="brand.id"
                  :label="brand.name"
                  :value="brand.id"
                />
              </el-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">策略类型</span>
              <el-select v-model="strategyType" placeholder="策略类型" @change="handleStrategyTypeChange">
                <el-option label="所有类型" value="" />
                <el-option label="内容优化" value="content_optimization" />
                <el-option label="平台适配" value="platform_adaptation" />
                <el-option label="时间优化" value="time_optimization" />
              </el-select>
            </div>
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon>
              添加策略
            </el-button>
          </div>
        </div>
      </template>
    </el-card>

    <el-card v-loading="loading">
      <el-table :data="strategies" stripe>
        <el-table-column prop="strategyType" label="策略类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getStrategyTypeTag(row.strategyType)">
              {{ getStrategyTypeLabel(row.strategyType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contentTemplate" label="内容模板" min-width="300">
          <template #default="{ row }">
            <el-text line-clamp="2">{{ row.contentTemplate }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="generation" label="代数" width="80" />
        <el-table-column prop="fitnessScore" label="适应度" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="(row.fitnessScore * 100).toFixed(0)" 
              :color="getFitnessColor(row.fitnessScore)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row.id)">详情</el-button>
            <el-button size="small" type="primary" @click="evolveStrategy(row.id)">进化</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination" v-if="total > 0">
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

    <!-- 添加策略对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加策略"
      width="800px"
    >
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="策略类型">
          <el-select v-model="addForm.strategyType" placeholder="选择策略类型" @change="handleStrategyTypeChangeInDialog">
            <el-option label="内容优化" value="content_optimization" />
            <el-option label="平台适配" value="platform_adaptation" />
            <el-option label="时间优化" value="time_optimization" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="模板选择" v-if="addForm.strategyType">
          <el-select v-model="selectedTemplate" placeholder="选择预设模板" @change="handleTemplateSelect">
            <el-option label="请选择模板" value="" />
            <el-option 
              v-for="(template, index) in filteredTemplates"
              :key="index"
              :label="template.name"
              :value="template.originalIndex"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="内容模板">
          <el-input
            v-model="addForm.contentTemplate"
            type="textarea"
            :rows="4"
            placeholder="输入策略内容模板"
          />
          <div class="template-hint" v-if="selectedTemplate !== '' && availableTemplates[Number(selectedTemplate)]">
            <el-tag size="small" type="info">模板提示</el-tag>
            <el-text size="small" type="info">{{ availableTemplates[Number(selectedTemplate)].hint }}</el-text>
          </div>
        </el-form-item>
        
        <el-form-item label="策略参数">
          <div v-if="addForm.strategyType === 'content_optimization'">
            <el-form :model="contentOptimizationParams" label-width="150px">
              <el-form-item label="目标长度">
                <el-input-number v-model="contentOptimizationParams.targetLength" :min="100" :max="2000" :step="50" />
              </el-form-item>
              <el-form-item label="包含关键词">
                <el-switch v-model="contentOptimizationParams.includeKeywords" />
              </el-form-item>
              <el-form-item label="优化级别">
                <el-select v-model="contentOptimizationParams.optimizationLevel">
                  <el-option label="低" value="low" />
                  <el-option label="中" value="medium" />
                  <el-option label="高" value="high" />
                </el-select>
              </el-form-item>
              <el-form-item label="优先关键词">
                <el-tag
                  v-for="(keyword, index) in contentOptimizationParams.priorityKeywords"
                  :key="index"
                  closable
                  @close="contentOptimizationParams.priorityKeywords.splice(index, 1)"
                >
                  {{ keyword }}
                </el-tag>
                <el-input
                  v-model="newKeyword"
                  placeholder="输入关键词"
                  @keyup.enter="addKeyword"
                  style="width: 200px; margin-left: 10px"
                />
                <el-button type="primary" size="small" @click="addKeyword">添加</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <div v-else-if="addForm.strategyType === 'platform_adaptation'">
            <el-form :model="platformAdaptationParams" label-width="150px">
              <el-form-item label="目标平台">
                <el-checkbox-group v-model="platformAdaptationParams.platforms">
                  <el-checkbox label="deepseek">DeepSeek</el-checkbox>
                  <el-checkbox label="openai">OpenAI</el-checkbox>
                  <el-checkbox label="kimi">Kimi</el-checkbox>
                  <el-checkbox label="wenxin">文心一言</el-checkbox>
                  <el-checkbox label="tongyi">通义千问</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="适配级别">
                <el-select v-model="platformAdaptationParams.adaptationLevel">
                  <el-option label="低" value="low" />
                  <el-option label="中" value="medium" />
                  <el-option label="高" value="high" />
                </el-select>
              </el-form-item>
              <el-form-item label="最大长度">
                <el-input-number v-model="platformAdaptationParams.maxLength" :min="100" :max="2000" :step="50" />
              </el-form-item>
            </el-form>
          </div>
          
          <div v-else-if="addForm.strategyType === 'time_optimization'">
            <el-form :model="timeOptimizationParams" label-width="150px">
              <el-form-item label="目标小时">
                <el-checkbox-group v-model="timeOptimizationParams.targetHours">
                  <el-checkbox v-for="hour in 24" :key="hour" :label="hour-1">{{ hour-1 }}:00</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="时区">
                <el-select v-model="timeOptimizationParams.timeZone">
                  <el-option label="亚洲/上海" value="Asia/Shanghai" />
                  <el-option label="美国/纽约" value="America/New_York" />
                  <el-option label="欧洲/伦敦" value="Europe/London" />
                </el-select>
              </el-form-item>
              <el-form-item label="工作日优先级">
                <el-checkbox-group v-model="timeOptimizationParams.weekdayPriority">
                  <el-checkbox label="1">周一</el-checkbox>
                  <el-checkbox label="2">周二</el-checkbox>
                  <el-checkbox label="3">周三</el-checkbox>
                  <el-checkbox label="4">周四</el-checkbox>
                  <el-checkbox label="5">周五</el-checkbox>
                  <el-checkbox label="6">周六</el-checkbox>
                  <el-checkbox label="0">周日</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="最小间隔(小时)">
                <el-input-number v-model="timeOptimizationParams.minInterval" :min="1" :max="24" :step="1" />
              </el-form-item>
            </el-form>
          </div>
          
          <el-input
            v-model="addForm.parametersJson"
            type="textarea"
            :rows="3"
            placeholder="输入策略参数（JSON格式）"
            v-if="false"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 进化策略对话框 -->
    <el-dialog
      v-model="evolveDialogVisible"
      title="进化策略"
      width="400px"
    >
      <el-form :model="evolveForm" label-width="120px">
        <el-form-item label="变异率">
          <el-slider
            v-model="evolveForm.mutationRate"
            :min="0"
            :max="1"
            :step="0.01"
            show-input
          />
          <span style="color: #999; font-size: 12px;">参数预留</span>
        </el-form-item>
        <el-form-item label="交叉率">
          <el-slider
            v-model="evolveForm.crossoverRate"
            :min="0"
            :max="1"
            :step="0.01"
            show-input
          />
          <span style="color: #999; font-size: 12px;">参数预留</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="evolveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEvolveForm">进化</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { EvolutionService } from '../api/evolution';
import { perceptionApi } from '../api/perception';

const router = useRouter();

const loading = ref(false);
const selectedBrand = ref('');
const strategyType = ref('');
const brands = ref<Array<{id: string; name: string}>>([]);
const strategies = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const addDialogVisible = ref(false);
const addForm = ref({
  strategyType: '',
  contentTemplate: '',
  parametersJson: '{}',
});

const selectedTemplate = ref<number | string>('');
const newKeyword = ref('');

const contentOptimizationParams = ref({
  targetLength: 500,
  includeKeywords: true,
  optimizationLevel: 'high',
  priorityKeywords: [] as string[],
  formatOptions: ['structured', 'bullet_points']
});

const platformAdaptationParams = ref({
  platforms: ['deepseek', 'openai', 'kimi'],
  adaptationLevel: 'medium',
  maxLength: 800,
  formatOptions: ['bullet_points', 'structured']
});

const timeOptimizationParams = ref({
  targetHours: [9, 12, 18, 21],
  timeZone: 'Asia/Shanghai',
  weekdayPriority: [1, 2, 3, 4, 5],
  minInterval: 4
});

const availableTemplates = [
  {
    name: '内容优化 - 基础模板',
    type: 'content_optimization',
    template: '针对{品牌名称}的内容优化策略，通过优化标题和摘要提高AI平台的提及率和排名',
    params: {
      targetLength: 500,
      includeKeywords: true,
      optimizationLevel: 'high',
      priorityKeywords: ['AI副班', '智能教学', '教育科技'],
      formatOptions: ['structured', 'bullet_points']
    },
    hint: '使用{品牌名称}占位符，系统会自动替换为实际品牌名称'
  },
  {
    name: '平台适配 - 多平台模板',
    type: 'platform_adaptation',
    template: '根据{platform}平台特性调整{品牌名称}的内容格式和风格，提高平台推荐度',
    params: {
      platforms: ['deepseek', 'openai', 'kimi'],
      adaptationLevel: 'medium',
      maxLength: 800,
      formatOptions: ['bullet_points', 'structured']
    },
    hint: '使用{platform}和{品牌名称}占位符'
  },
  {
    name: '时间优化 - 最佳时段模板',
    type: 'time_optimization',
    template: '分析用户活跃时间，在最佳时段发布{品牌名称}相关内容，提高曝光率',
    params: {
      targetHours: [9, 12, 18, 21],
      timeZone: 'Asia/Shanghai',
      weekdayPriority: [1, 2, 3, 4, 5],
      minInterval: 4
    },
    hint: '使用{品牌名称}占位符'
  }
].map((t, i) => ({ ...t, originalIndex: i }));

const filteredTemplates = computed(() => {
  if (!addForm.value.strategyType) return [];
  return availableTemplates.filter(t => t.type === addForm.value.strategyType);
});

const evolveDialogVisible = ref(false);
const evolveForm = ref({
  mutationRate: 0.1,
  crossoverRate: 0.7,
});
const currentStrategyId = ref('');

const getStrategyTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    'content_optimization': 'primary',
    'platform_adaptation': 'success',
    'time_optimization': 'warning',
  };
  return tags[type] || 'info';
};

const getStrategyTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'content_optimization': '内容优化',
    'platform_adaptation': '平台适配',
    'time_optimization': '时间优化',
  };
  return labels[type] || type;
};

const getStatusTag = (status: string) => {
  const tags: Record<string, string> = {
    'active': 'success',
    'inactive': 'info',
    'archived': 'danger',
  };
  return tags[status] || 'info';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'active': '活跃',
    'inactive': '未激活',
    'archived': '已归档',
  };
  return labels[status] || status;
};

const getFitnessColor = (fitness: number) => {
  if (fitness >= 0.8) return '#67c23a';
  if (fitness >= 0.6) return '#e6a23c';
  return '#f56c6c';
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
  
  loading.value = true;
  try {
    const data = await EvolutionService.getStrategies(selectedBrand.value, strategyType.value);
    strategies.value = data;
    total.value = data.length;
  } catch (error) {
    console.error('加载策略失败:', error);
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  addForm.value = {
    strategyType: '',
    contentTemplate: '',
    parametersJson: '{}',
  };
  selectedTemplate.value = '';
  contentOptimizationParams.value = {
    targetLength: 500,
    includeKeywords: true,
    optimizationLevel: 'high',
    priorityKeywords: [],
    formatOptions: ['structured', 'bullet_points']
  };
  platformAdaptationParams.value = {
    platforms: ['deepseek', 'openai', 'kimi'],
    adaptationLevel: 'medium',
    maxLength: 800,
    formatOptions: ['bullet_points', 'structured']
  };
  timeOptimizationParams.value = {
    targetHours: [9, 12, 18, 21],
    timeZone: 'Asia/Shanghai',
    weekdayPriority: [1, 2, 3, 4, 5],
    minInterval: 4
  };
  addDialogVisible.value = true;
};

const handleStrategyTypeChangeInDialog = () => {
  selectedTemplate.value = '';
  addForm.value.contentTemplate = '';
};

const handleTemplateSelect = () => {
  if (selectedTemplate.value !== '' && availableTemplates[Number(selectedTemplate.value)]) {
    const template = availableTemplates[Number(selectedTemplate.value)];
    addForm.value.strategyType = template.type;
    addForm.value.contentTemplate = template.template;
    if (template.type === 'content_optimization') {
      contentOptimizationParams.value = { ...template.params } as typeof contentOptimizationParams.value;
    } else if (template.type === 'platform_adaptation') {
      platformAdaptationParams.value = { ...template.params } as typeof platformAdaptationParams.value;
    } else if (template.type === 'time_optimization') {
      timeOptimizationParams.value = { ...template.params } as typeof timeOptimizationParams.value;
    }
  }
};

const addKeyword = () => {
  if (newKeyword.value.trim()) {
    contentOptimizationParams.value.priorityKeywords.push(newKeyword.value.trim());
    newKeyword.value = '';
  }
};

const submitAddForm = async () => {
  if (!addForm.value.strategyType) {
    ElMessage.error('请选择策略类型');
    return;
  }
  if (!addForm.value.contentTemplate) {
    ElMessage.error('请输入内容模板');
    return;
  }
  if (!selectedBrand.value) {
    ElMessage.error('请选择品牌');
    return;
  }

  try {
    let parameters = {};
    
    if (addForm.value.strategyType === 'content_optimization') {
      parameters = contentOptimizationParams.value;
    } else if (addForm.value.strategyType === 'platform_adaptation') {
      parameters = platformAdaptationParams.value;
    } else if (addForm.value.strategyType === 'time_optimization') {
      parameters = timeOptimizationParams.value;
    }
    
    addForm.value.parametersJson = JSON.stringify(parameters);

    await EvolutionService.createStrategy({
      brandId: selectedBrand.value,
      strategyType: addForm.value.strategyType,
      contentTemplate: addForm.value.contentTemplate,
      parameters,
    });

    addDialogVisible.value = false;
    ElMessage.success('策略添加成功');
    loadStrategies();
  } catch (error: any) {
    console.error('添加策略失败:', error);
    const errorMessage = error.response?.data?.message || error.message || '添加策略失败';
    ElMessage.error(`添加策略失败: ${errorMessage}`);
  }
};

const evolveStrategy = (strategyId: string) => {
  currentStrategyId.value = strategyId;
  evolveForm.value = {
    mutationRate: 0.1,
    crossoverRate: 0.7,
  };
  evolveDialogVisible.value = true;
};

const submitEvolveForm = async () => {
  try {
    await EvolutionService.evolveStrategy(
      currentStrategyId.value,
      evolveForm.value.mutationRate,
      evolveForm.value.crossoverRate
    );

    evolveDialogVisible.value = false;
    ElMessage.success('策略进化成功');
    ElMessage.warning('当前为模拟进化，真实算法开发中');
    loadStrategies();
  } catch (error: any) {
    console.error('策略进化失败:', error);
    const errorMessage = error.response?.data?.message || error.message || '策略进化失败';
    ElMessage.error(`策略进化失败: ${errorMessage}`);
  }
};

const handleDelete = async (strategyId: string) => {
  try {
    await EvolutionService.deleteStrategy(strategyId);
    ElMessage.success('策略删除成功');
    loadStrategies();
  } catch (error: any) {
    console.error('删除策略失败:', error);
    const errorMessage = error.response?.data?.message || error.message || '删除策略失败';
    ElMessage.error(`删除策略失败: ${errorMessage}`);
  }
};

const viewDetails = (strategyId: string) => {
  router.push(`/evolution/strategies/${strategyId}`);
};

const handleBrandChange = () => {
  loadStrategies();
};

const handleStrategyTypeChange = () => {
  loadStrategies();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  loadStrategies();
};

const handleCurrentChange = (current: number) => {
  currentPage.value = current;
  loadStrategies();
};

onMounted(() => {
  loadBrands();
});

watch(selectedBrand, (newValue) => {
  if (newValue) {
    loadStrategies();
  }
});
</script>

<style scoped>
.strategy-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.template-hint {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.el-checkbox {
  margin-right: 10px;
}
</style>