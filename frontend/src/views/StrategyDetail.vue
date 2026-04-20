<template>
  <div class="strategy-detail">
    <el-card class="page-header">
      <template #header>
        <div class="page-header-content">
          <h1>策略详情</h1>
          <div class="header-actions">
            <el-button @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <el-button type="primary" @click="openEditDialog">编辑</el-button>
            <el-button type="success" @click="evolveStrategy">进化</el-button>
          </div>
        </div>
      </template>
    </el-card>

    <el-card v-loading="loading">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="策略类型">
          <el-tag :type="getStrategyTypeTag(strategy?.strategyType)">
            {{ getStrategyTypeLabel(strategy?.strategyType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="代数">{{ strategy?.generation }}</el-descriptions-item>
        <el-descriptions-item label="适应度">
          <el-progress 
            :percentage="(strategy?.fitnessScore * 100).toFixed(0)" 
            :color="getFitnessColor(strategy?.fitnessScore)"
            :stroke-width="8"
          />
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTag(strategy?.status)">
            {{ strategy?.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="评估次数">{{ strategy?.evaluations || 0 }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(strategy?.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="内容模板" :span="3">
          {{ strategy?.contentTemplate }}
        </el-descriptions-item>
        <el-descriptions-item label="策略参数" :span="3">
          <pre>{{ formatParameters(strategy?.parameters) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 评估历史 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>评估历史</span>
          <el-button size="small" type="primary" @click="openEvaluateDialog">添加评估</el-button>
        </div>
      </template>
      <el-table :data="feedbackList" stripe>
        <el-table-column prop="createdAt" label="评估时间" width="180" />
        <el-table-column prop="predictedScore" label="预测分数" width="120" />
        <el-table-column prop="actualScore" label="实际分数" width="120" />
        <el-table-column prop="fitnessScore" label="适应度" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="(row.fitnessScore * 100).toFixed(0)" 
              :color="getFitnessColor(row.fitnessScore)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="feedbackText" label="反馈文本" min-width="200">
          <template #default="{ row }">
            <el-text line-clamp="2">{{ row.feedbackText }}</el-text>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑策略对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑策略"
      width="600px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="策略类型">
          <el-select v-model="editForm.strategyType" placeholder="选择策略类型">
            <el-option label="内容优化" value="content_optimization" />
            <el-option label="平台适配" value="platform_adaptation" />
            <el-option label="时间优化" value="time_optimization" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容模板">
          <el-input
            v-model="editForm.contentTemplate"
            type="textarea"
            :rows="4"
            placeholder="输入策略内容模板"
          />
        </el-form-item>
        <el-form-item label="策略参数">
          <el-input
            v-model="editForm.parametersJson"
            type="textarea"
            :rows="3"
            placeholder="输入策略参数（JSON格式）"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="选择状态">
            <el-option label="active" value="active" />
            <el-option label="inactive" value="inactive" />
            <el-option label="archived" value="archived" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm">确定</el-button>
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
        </el-form-item>
        <el-form-item label="交叉率">
          <el-slider
            v-model="evolveForm.crossoverRate"
            :min="0"
            :max="1"
            :step="0.01"
            show-input
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="evolveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEvolveForm">进化</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 评估策略对话框 -->
    <el-dialog
      v-model="evaluateDialogVisible"
      title="评估策略"
      width="500px"
    >
      <el-form :model="evaluateForm" label-width="100px">
        <el-form-item label="查询ID">
          <el-input v-model="evaluateForm.queryId" placeholder="输入查询ID" />
        </el-form-item>
        <el-form-item label="预测分数">
          <el-input-number
            v-model="evaluateForm.predictedScore"
            :min="0"
            :max="100"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="实际分数">
          <el-input-number
            v-model="evaluateForm.actualScore"
            :min="0"
            :max="100"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="反馈文本">
          <el-input
            v-model="evaluateForm.feedbackText"
            type="textarea"
            :rows="3"
            placeholder="输入反馈文本"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="evaluateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEvaluateForm">评估</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { EvolutionService } from '../api/evolution';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const strategy = ref<any>(null);
const feedbackList = ref<any[]>([]);

const editDialogVisible = ref(false);
const editForm = ref({
  strategyType: '',
  contentTemplate: '',
  parametersJson: '{}',
  status: 'active',
});

const evolveDialogVisible = ref(false);
const evolveForm = ref({
  mutationRate: 0.1,
  crossoverRate: 0.7,
});

const evaluateDialogVisible = ref(false);
const evaluateForm = ref({
  queryId: '',
  predictedScore: 0,
  actualScore: 0,
  feedbackText: '',
});

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

const getFitnessColor = (fitness: number) => {
  if (fitness >= 0.8) return '#67c23a';
  if (fitness >= 0.6) return '#e6a23c';
  return '#f56c6c';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

const formatParameters = (parameters: Record<string, any>) => {
  if (!parameters) return '{}';
  return JSON.stringify(parameters, null, 2);
};

const loadStrategy = async () => {
  const strategyId = route.params.id as string;
  if (!strategyId) return;
  
  loading.value = true;
  try {
    const data = await EvolutionService.getStrategyById(strategyId);
    strategy.value = data;
    editForm.value = {
      strategyType: data.strategyType,
      contentTemplate: data.contentTemplate,
      parametersJson: JSON.stringify(data.parameters || {}, null, 2),
      status: data.status,
    };
  } catch (error) {
    console.error('加载策略失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadFeedback = async () => {
  const strategyId = route.params.id as string;
  if (!strategyId) return;
  
  try {
    const data = await EvolutionService.getCriticFeedback(strategyId);
    feedbackList.value = data;
  } catch (error) {
    console.error('加载评估历史失败:', error);
  }
};

const openEditDialog = () => {
  if (strategy.value) {
    editForm.value = {
      strategyType: strategy.value.strategyType,
      contentTemplate: strategy.value.contentTemplate,
      parametersJson: JSON.stringify(strategy.value.parameters || {}, null, 2),
      status: strategy.value.status,
    };
    editDialogVisible.value = true;
  }
};

const submitEditForm = async () => {
  const strategyId = route.params.id as string;
  if (!strategyId) return;
  
  try {
    let parameters = {};
    try {
      parameters = JSON.parse(editForm.value.parametersJson);
    } catch (e) {
      ElMessage.error('参数格式错误，请输入有效的 JSON');
      return;
    }

    await EvolutionService.updateStrategy(strategyId, {
      contentTemplate: editForm.value.contentTemplate,
      parameters,
      status: editForm.value.status,
    });

    editDialogVisible.value = false;
    ElMessage.success('策略更新成功');
    loadStrategy();
  } catch (error) {
    console.error('更新策略失败:', error);
    ElMessage.error('更新策略失败');
  }
};

const evolveStrategy = () => {
  evolveForm.value = {
    mutationRate: 0.1,
    crossoverRate: 0.7,
  };
  evolveDialogVisible.value = true;
};

const submitEvolveForm = async () => {
  const strategyId = route.params.id as string;
  if (!strategyId) return;
  
  try {
    await EvolutionService.evolveStrategy(
      strategyId,
      evolveForm.value.mutationRate,
      evolveForm.value.crossoverRate
    );

    evolveDialogVisible.value = false;
    ElMessage.success('策略进化成功');
    loadStrategy();
  } catch (error) {
    console.error('策略进化失败:', error);
    ElMessage.error('策略进化失败');
  }
};

const openEvaluateDialog = () => {
  evaluateForm.value = {
    queryId: '',
    predictedScore: 0,
    actualScore: 0,
    feedbackText: '',
  };
  evaluateDialogVisible.value = true;
};

const submitEvaluateForm = async () => {
  const strategyId = route.params.id as string;
  if (!strategyId) return;
  
  try {
    await EvolutionService.evaluateStrategy({
      strategyId,
      queryId: evaluateForm.value.queryId,
      predictedScore: evaluateForm.value.predictedScore,
      actualScore: evaluateForm.value.actualScore,
      feedbackText: evaluateForm.value.feedbackText,
    });

    evaluateDialogVisible.value = false;
    ElMessage.success('策略评估成功');
    loadStrategy();
    loadFeedback();
  } catch (error) {
    console.error('策略评估失败:', error);
    ElMessage.error('策略评估失败');
  }
};

const goBack = () => {
  router.push('/evolution/strategies');
};

onMounted(() => {
  loadStrategy();
  loadFeedback();
});
</script>

<style scoped>
.strategy-detail {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

pre {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
}
</style>