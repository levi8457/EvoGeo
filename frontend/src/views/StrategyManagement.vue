<template>
  <div class="strategy-management">
    <el-card class="page-header">
      <template #header>
        <div class="page-header-content">
          <h1>策略管理</h1>
          <div class="header-actions">
            <el-select v-model="selectedBrand" placeholder="选择品牌" @change="handleBrandChange">
              <el-option
                v-for="brand in brands"
                :key="brand.id"
                :label="brand.name"
                :value="brand.id"
              />
            </el-select>
            <el-select v-model="strategyType" placeholder="策略类型" @change="handleStrategyTypeChange">
              <el-option label="所有类型" value="" />
              <el-option label="内容优化" value="content_optimization" />
              <el-option label="平台适配" value="platform_adaptation" />
              <el-option label="时间优化" value="time_optimization" />
            </el-select>
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
              {{ row.status }}
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
      width="600px"
    >
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="策略类型">
          <el-select v-model="addForm.strategyType" placeholder="选择策略类型">
            <el-option label="内容优化" value="content_optimization" />
            <el-option label="平台适配" value="platform_adaptation" />
            <el-option label="时间优化" value="time_optimization" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容模板">
          <el-input
            v-model="addForm.contentTemplate"
            type="textarea"
            :rows="4"
            placeholder="输入策略内容模板"
          />
        </el-form-item>
        <el-form-item label="策略参数">
          <el-input
            v-model="addForm.parametersJson"
            type="textarea"
            :rows="3"
            placeholder="输入策略参数（JSON格式）"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { EvolutionService } from '../api/evolution';

const router = useRouter();

const loading = ref(false);
const selectedBrand = ref('');
const strategyType = ref('');
const brands = ref<any[]>([]);
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

const getFitnessColor = (fitness: number) => {
  if (fitness >= 0.8) return '#67c23a';
  if (fitness >= 0.6) return '#e6a23c';
  return '#f56c6c';
};

const loadBrands = async () => {
  try {
    // 暂时使用模拟数据，后续从 API 获取
    brands.value = [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'AI副班' },
      { id: '234e5678-f90c-23d4-b567-537725285111', name: 'AI助教' },
    ];
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
  addDialogVisible.value = true;
};

const submitAddForm = async () => {
  try {
    let parameters = {};
    try {
      parameters = JSON.parse(addForm.value.parametersJson);
    } catch (e) {
      ElMessage.error('参数格式错误，请输入有效的 JSON');
      return;
    }

    await EvolutionService.createStrategy({
      brandId: selectedBrand.value,
      strategyType: addForm.value.strategyType,
      contentTemplate: addForm.value.contentTemplate,
      parameters,
    });

    addDialogVisible.value = false;
    ElMessage.success('策略添加成功');
    loadStrategies();
  } catch (error) {
    console.error('添加策略失败:', error);
    ElMessage.error('添加策略失败');
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
    loadStrategies();
  } catch (error) {
    console.error('策略进化失败:', error);
    ElMessage.error('策略进化失败');
  }
};

const handleDelete = async (strategyId: string) => {
  try {
    await EvolutionService.deleteStrategy(strategyId);
    ElMessage.success('策略删除成功');
    loadStrategies();
  } catch (error) {
    console.error('删除策略失败:', error);
    ElMessage.error('删除策略失败');
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>