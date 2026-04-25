<template>
  <div class="execution-dashboard">
    <h1 class="page-title">执行大屏</h1>

    <!-- 品牌选择 -->
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

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card shadow="hover" class="stat-card">
        <template #header>
          <div class="card-header">
            <span>总内容数</span>
          </div>
        </template>
        <div class="stat-value">{{ deploymentStats.total || 0 }}</div>
        <div class="stat-desc">篇内容</div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <template #header>
          <div class="card-header">
            <span>已部署内容</span>
          </div>
        </template>
        <div class="stat-value">{{ deploymentStats.deployed || 0 }}</div>
        <div class="stat-desc">篇内容</div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <template #header>
          <div class="card-header">
            <span>部署率</span>
          </div>
        </template>
        <div class="stat-value">{{ deploymentStats.deploymentRate?.toFixed(2) || 0 }}%</div>
        <div class="stat-desc">部署率</div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <template #header>
          <div class="card-header">
            <span>合规通过率</span>
          </div>
        </template>
        <div class="stat-value">{{ complianceStats.complianceRate?.toFixed(2) || 0 }}%</div>
        <div class="stat-desc">通过率</div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 内容状态分布 -->
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <div class="card-header">
            <span>内容状态分布</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <v-chart :option="contentStatusOption" height="300px" />
        </div>
      </el-card>

      <!-- 合规风险分布 -->
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <div class="card-header">
            <span>合规风险分布</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <v-chart :option="complianceRiskOption" height="300px" />
        </div>
      </el-card>

      <!-- 部署趋势 -->
      <el-card shadow="hover" class="chart-card full-width">
        <template #header>
          <div class="card-header">
            <span>部署趋势</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <v-chart :option="deploymentTrendOption" height="300px" />
        </div>
      </el-card>
    </div>

    <!-- 已部署内容列表 -->
    <el-card shadow="hover" class="deployed-list-card">
      <template #header>
        <div class="card-header">
          <span>已部署内容列表</span>
          <el-tag type="success">{{ deployedContents.length }} 条</el-tag>
        </div>
      </template>
      <el-table :data="deployedContents" stripe v-loading="loading">
        <el-table-column prop="contentTitle" label="标题" min-width="200" />
        <el-table-column prop="contentType" label="内容类型" width="120">
          <template #default="scope">
            <el-tag>{{ getContentTypeLabel(scope.row.contentType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="platform" label="平台" width="100">
          <template #default="scope">
            {{ getPlatformLabel(scope.row.platform) }}
          </template>
        </el-table-column>
        <el-table-column prop="deployedAt" label="部署时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.deployedAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="complianceStatus" label="合规状态" width="120">
          <template #default="scope">
            <el-tag :type="getComplianceTagType(scope.row.complianceStatus)">
              {{ getComplianceStatusLabel(scope.row.complianceStatus) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { PieChart, LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ExecutionService } from '../api/execution';
import { ComplianceService } from '../api/compliance';
import { GenerationService } from '../api/generation';
import { perceptionApi } from '../api/perception';

// 注册必要的组件
use([
  PieChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer,
]);

// 响应式数据
const selectedBrand = ref('');
const brands = ref<Array<{id: string; name: string}>>([]);
const loading = ref(false);
const deployedContents = ref<any[]>([]);

const deploymentStats = ref({
  total: 0,
  deployed: 0,
  draft: 0,
  archived: 0,
  deploymentRate: 0,
});

const complianceStats = ref({
  totalChecks: 0,
  compliantChecks: 0,
  nonCompliantChecks: 0,
  complianceRate: 0,
  riskDistribution: {
    low: 0,
    medium: 0,
    high: 0,
  },
});

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

// 加载大屏数据
const loadDashboardData = async () => {
  if (!selectedBrand.value) return;

  loading.value = true;
  try {
    // 获取部署统计信息
    const deploymentData = await ExecutionService.getDeploymentStatistics(selectedBrand.value);
    deploymentStats.value = deploymentData;

    // 获取合规统计信息
    const complianceData = await ComplianceService.getComplianceStatistics(selectedBrand.value);
    complianceStats.value = complianceData;

    // 获取已部署内容列表
    const deployedData = await GenerationService.getGeneratedContents({
      brandId: selectedBrand.value,
      status: 'published',
    });
    deployedContents.value = deployedData.filter((c: any) => c.deploymentStatus === 'deployed');
  } catch (error) {
    console.error('加载大屏数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 内容状态分布图表配置
const contentStatusOption = computed(() => {
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
        name: '内容状态',
        type: 'pie',
        radius: '60%',
        data: [
          { name: '已部署', value: deploymentStats.value.deployed || 0 },
          { name: '草稿', value: deploymentStats.value.draft || 0 },
          { name: '已归档', value: deploymentStats.value.archived || 0 },
        ],
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

// 合规风险分布图表配置
const complianceRiskOption = computed(() => {
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
        name: '风险等级',
        type: 'pie',
        radius: '60%',
        data: [
          { name: '低风险', value: complianceStats.value.riskDistribution?.low || 0 },
          { name: '中风险', value: complianceStats.value.riskDistribution?.medium || 0 },
          { name: '高风险', value: complianceStats.value.riskDistribution?.high || 0 },
        ],
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

// 部署趋势图表配置
const deploymentTrendOption = computed(() => {
  // 模拟数据
  const trendData = [
    { date: '2026-04-10', deployed: 2, draft: 5, archived: 1 },
    { date: '2026-04-11', deployed: 3, draft: 4, archived: 1 },
    { date: '2026-04-12', deployed: 1, draft: 6, archived: 0 },
    { date: '2026-04-13', deployed: 4, draft: 3, archived: 1 },
    { date: '2026-04-14', deployed: 2, draft: 5, archived: 0 },
    { date: '2026-04-15', deployed: 3, draft: 4, archived: 1 },
    { date: '2026-04-16', deployed: 5, draft: 2, archived: 1 },
  ];

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['已部署', '草稿', '已归档'],
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
      data: trendData.map(item => item.date),
    },
    yAxis: {
      type: 'value',
      min: 0,
    },
    series: [
      {
        name: '已部署',
        type: 'line',
        data: trendData.map(item => item.deployed),
        stack: 'Total',
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.5)',
        },
        lineStyle: {
          color: '#409eff',
        },
      },
      {
        name: '草稿',
        type: 'line',
        data: trendData.map(item => item.draft),
        stack: 'Total',
        areaStyle: {
          color: 'rgba(103, 194, 58, 0.5)',
        },
        lineStyle: {
          color: '#67c23a',
        },
      },
      {
        name: '已归档',
        type: 'line',
        data: trendData.map(item => item.archived),
        stack: 'Total',
        areaStyle: {
          color: 'rgba(230, 162, 60, 0.5)',
        },
        lineStyle: {
          color: '#e6a23c',
        },
      },
    ],
  };
});

// 组件挂载时加载数据
onMounted(async () => {
  await loadBrands();
  await loadDashboardData();
});

// 辅助函数
const getContentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    article: '文章',
    social_media: '社交媒体',
    advertisement: '广告',
    blog: '博客',
    product_description: '产品描述',
    email: '邮件',
  };
  return labels[type] || type;
};

const getPlatformLabel = (platform: string) => {
  const labels: Record<string, string> = {
    deepseek: 'DeepSeek',
    chatgpt: 'ChatGPT',
    kimi: 'Kimi',
    wenxin: '文心一言',
    tongyi: '通义千问',
  };
  return labels[platform] || platform;
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

const getComplianceTagType = (status: string) => {
  switch (status) {
    case 'passed': return 'success';
    case 'failed': return 'danger';
    case 'pending': return 'warning';
    default: return 'info';
  }
};

const getComplianceStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    passed: '通过',
    failed: '不通过',
    pending: '待检测',
  };
  return labels[status] || status || '未检测';
};
</script>

<style scoped>
.execution-dashboard {
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

.deployed-list-card {
  margin-top: 30px;
}
</style>
