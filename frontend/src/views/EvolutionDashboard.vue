<template>
  <div class="evolution-dashboard">
    <el-card class="page-header">
      <template #header>
        <div class="page-header-content">
          <h1>进化大屏</h1>
          <div class="header-actions">
            <el-select v-model="selectedBrand" placeholder="选择品牌" @change="handleBrandChange">
              <el-option
                v-for="brand in brands"
                :key="brand.id"
                :label="brand.name"
                :value="brand.id"
              />
            </el-select>
            <el-select v-model="timeRange" placeholder="时间范围" @change="handleTimeRangeChange">
              <el-option label="7天" value="7" />
              <el-option label="30天" value="30" />
              <el-option label="90天" value="90" />
            </el-select>
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </div>
      </template>
    </el-card>

    <el-row :gutter="20">
      <!-- 核心指标 -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>核心指标</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ dashboardData.totalStrategies || 0 }}</div>
                <div class="stat-label">策略总数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ dashboardData.totalEvaluations || 0 }}</div>
                <div class="stat-label">评估次数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ (dashboardData.avgFitness || 0).toFixed(2) }}</div>
                <div class="stat-label">平均适应度</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ dashboardData.topStrategies?.length || 0 }}</div>
                <div class="stat-label">优秀策略</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 进化趋势图 -->
      <el-col :span="12">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>进化趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              :option="evolutionTrendOption"
              autoresize
            />
          </div>
        </el-card>
      </el-col>

      <!-- 策略性能对比 -->
      <el-col :span="12">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>策略性能对比</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              :option="performanceComparisonOption"
              autoresize
            />
          </div>
        </el-card>
      </el-col>

      <!-- 评估统计 -->
      <el-col :span="12">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>评估统计</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              :option="evaluationStatsOption"
              autoresize
            />
          </div>
        </el-card>
      </el-col>

      <!-- 顶部策略 -->
      <el-col :span="12">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>顶部策略</span>
            </div>
          </template>
          <el-table :data="topStrategies" stripe>
            <el-table-column prop="strategyType" label="策略类型" width="120" />
            <el-table-column prop="contentTemplate" label="内容模板" min-width="200">
              <template #default="{ row }">
                <el-text line-clamp="2">{{ row.contentTemplate }}</el-text>
              </template>
            </el-table-column>
            <el-table-column prop="fitnessScore" label="适应度" width="100">
              <template #default="{ row }">
                <el-progress 
                  :percentage="(row.fitnessScore * 100).toFixed(0)" 
                  :color="getFitnessColor(row.fitnessScore)"
                  :stroke-width="8"
                />
              </template>
            </el-table-column>
            <el-table-column prop="generation" label="代数" width="80" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewStrategy(row.id)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Refresh } from '@element-plus/icons-vue';
import { EvolutionService } from '../api/evolution';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  ToolboxComponent
} from 'echarts/components';

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  ToolboxComponent
]);

const router = useRouter();

const loading = ref(false);
const selectedBrand = ref('');
const timeRange = ref('30');
const brands = ref<any[]>([]);
const dashboardData = ref<any>({});

const evolutionTrendOption = computed(() => {
  const data = dashboardData.value.generationStats || [];
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['平均适应度', '最高适应度', '最低适应度']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((item: any) => `第${item.generation}代`)
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1
    },
    series: [
      {
        name: '平均适应度',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: data.map((item: any) => item.avgFitness)
      },
      {
        name: '最高适应度',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: data.map((item: any) => item.maxFitness)
      },
      {
        name: '最低适应度',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: data.map((item: any) => item.minFitness)
      }
    ]
  };
});

const performanceComparisonOption = computed(() => {
  const topStrategies = dashboardData.value.topStrategies || [];
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: topStrategies.map((item: any) => item.strategyType)
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1
    },
    series: [
      {
        name: '适应度',
        type: 'bar',
        data: topStrategies.map((item: any) => item.fitnessScore),
        itemStyle: {
          color: '#188df0'
        }
      }
    ]
  };
});

const evaluationStatsOption = computed(() => {
  const stats = dashboardData.value.evaluationStats || {
    errorDistribution: { low: 0, medium: 0, high: 0 }
  };
  return {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: '误差分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: stats.errorDistribution.low, name: '低误差' },
          { value: stats.errorDistribution.medium, name: '中等误差' },
          { value: stats.errorDistribution.high, name: '高误差' }
        ]
      }
    ]
  };
});

const topStrategies = computed(() => {
  return dashboardData.value.topStrategies || [];
});

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

const loadDashboardData = async () => {
  if (!selectedBrand.value) return;
  
  loading.value = true;
  try {
    const data = await EvolutionService.getDashboard(selectedBrand.value, timeRange.value);
    dashboardData.value = data;
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  loadDashboardData();
};

const handleBrandChange = () => {
  loadDashboardData();
};

const handleTimeRangeChange = () => {
  loadDashboardData();
};

const viewStrategy = (strategyId: string) => {
  router.push(`/evolution/strategies/${strategyId}`);
};

onMounted(() => {
  loadBrands();
});

watch(selectedBrand, (newValue) => {
  if (newValue) {
    loadDashboardData();
  }
});
</script>

<style scoped>
.evolution-dashboard {
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

.stat-card {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.chart-container {
  height: 300px;
  margin-top: 20px;
}

.el-table {
  margin-top: 20px;
}
</style>