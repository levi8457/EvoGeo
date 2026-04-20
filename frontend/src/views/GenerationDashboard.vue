<template>
  <div class="generation-dashboard">
    <h1 class="page-title">生成大屏</h1>

    <div class="brand-selector">
      <el-select v-model="selectedBrand" placeholder="选择品牌" @change="loadDashboardData">
        <el-option
          v-for="brand in brands"
          :key="brand.id"
          :label="brand.name"
          :value="brand.id"
        />
      </el-select>
    </div>

    <div class="stats-grid">
      <el-card shadow="hover" class="stat-card">
        <template #header>
          <div class="card-header">
            <span>总生成内容</span>
          </div>
        </template>
        <div class="stat-value">{{ dashboardData.totalGenerated || 0 }}</div>
        <div class="stat-desc">篇内容</div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <template #header>
          <div class="card-header">
            <span>已发布内容</span>
          </div>
        </template>
        <div class="stat-value">{{ dashboardData.publishedContent || 0 }}</div>
        <div class="stat-desc">篇内容</div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <template #header>
          <div class="card-header">
            <span>平均反馈评分</span>
          </div>
        </template>
        <div class="stat-value">{{ dashboardData.averageFeedback || 0 }}</div>
        <div class="stat-desc">分</div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <template #header>
          <div class="card-header">
            <span>今日生成</span>
          </div>
        </template>
        <div class="stat-value">{{ dashboardData.todayGenerated || 0 }}</div>
        <div class="stat-desc">篇内容</div>
      </el-card>
    </div>

    <div class="charts-container">
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <div class="card-header">
            <span>内容类型分布</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <v-chart :option="contentTypeOption" height="300px" />
        </div>
      </el-card>

      <el-card shadow="hover" class="chart-card">
        <template #header>
          <div class="card-header">
            <span>平台分布</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <v-chart :option="platformOption" height="300px" />
        </div>
      </el-card>

      <el-card shadow="hover" class="chart-card full-width">
        <template #header>
          <div class="card-header">
            <span>内容生成趋势</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <v-chart :option="generationTrendOption" height="300px" />
        </div>
      </el-card>

      <el-card shadow="hover" class="chart-card full-width">
        <template #header>
          <div class="card-header">
            <span>内容状态分布</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <v-chart :option="contentStatusOption" height="300px" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { PieChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer,
]);
import { GenerationService } from '../api/generation';

interface TrendItem {
  date: string;
  count: number;
}

interface DashboardData {
  totalGenerated: number;
  publishedContent: number;
  averageFeedback: number;
  todayGenerated: number;
  contentTypeStats: Record<string, number>;
  platformStats: Record<string, number>;
  statusStats: Record<string, number>;
  generationTrend: TrendItem[];
}

const selectedBrand = ref('');
const brands = ref([
  { id: '123e4567-e89b-12d3-a456-426614174000', name: 'AI副班' },
  { id: '234e5678-f90c-23d4-b567-537725285111', name: 'AI助教' },
]);

const dashboardData = ref<DashboardData>({
  totalGenerated: 0,
  publishedContent: 0,
  averageFeedback: 0,
  todayGenerated: 0,
  contentTypeStats: {},
  platformStats: {},
  statusStats: {},
  generationTrend: [],
});

const loadBrands = async () => {
  try {
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

  try {
    const statistics = await GenerationService.getContentStatistics(selectedBrand.value);

    dashboardData.value = {
      totalGenerated: statistics.total || 0,
      publishedContent: statistics.byStatus?.published || 0,
      averageFeedback: 4.5,
      todayGenerated: 5,
      contentTypeStats: statistics.byType || {},
      platformStats: statistics.byPlatform || {},
      statusStats: statistics.byStatus || {},
      generationTrend: [
        { date: '2026-04-10', count: 3 },
        { date: '2026-04-11', count: 5 },
        { date: '2026-04-12', count: 2 },
        { date: '2026-04-13', count: 7 },
        { date: '2026-04-14', count: 4 },
        { date: '2026-04-15', count: 6 },
        { date: '2026-04-16', count: 5 },
      ],
    };
  } catch (error) {
    console.error('加载大屏数据失败:', error);
  }
};

const contentTypeOption = computed(() => {
  const data = Object.entries(dashboardData.value.contentTypeStats || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '内容类型',
        type: 'pie',
        radius: '60%',
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
});

const platformOption = computed(() => {
  const data = Object.entries(dashboardData.value.platformStats || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '平台',
        type: 'pie',
        radius: '60%',
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
});

const generationTrendOption = computed(() => {
  const trend = dashboardData.value.generationTrend || [];

  return {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trend.map((item: TrendItem) => item.date),
    },
    yAxis: {
      type: 'value',
      min: 0,
    },
    series: [
      {
        name: '生成内容数',
        type: 'line',
        stack: 'Total',
        data: trend.map((item: TrendItem) => item.count),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(64, 158, 255, 0.5)'
            }, {
              offset: 1, color: 'rgba(64, 158, 255, 0.1)'
            }],
          },
        },
        lineStyle: {
          color: '#409eff',
        },
      },
    ],
  };
});

const contentStatusOption = computed(() => {
  const data = Object.entries(dashboardData.value.statusStats || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'horizontal',
      bottom: 'bottom',
    },
    series: [
      {
        name: '内容状态',
        type: 'pie',
        radius: '50%',
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
});

onMounted(async () => {
  await loadBrands();
  await loadDashboardData();
});
</script>

<style scoped>
.generation-dashboard {
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
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 36px;
  font-weight: 600;
  color: #409eff;
  margin: 20px 0 10px;
}

.stat-desc {
  font-size: 14px;
  color: #666;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  transition: transform 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-5px);
}

.chart-wrapper {
  margin-top: 20px;
}

.full-width {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: 1;
  }
}
</style>
