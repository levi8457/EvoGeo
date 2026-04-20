<template>
  <div class="perception-dashboard">
    <!-- 顶部筛选器 -->
    <el-card class="filter-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="品牌选择">
          <el-select v-model="selectedBrandId" placeholder="请选择品牌" style="width: 220px">
            <el-option label="品牌1" value="1"></el-option>
            <el-option label="品牌2" value="2"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="平台筛选">
          <el-checkbox-group v-model="selectedPlatforms" class="platform-checkbox-group">
            <el-tooltip content="DeepSeek" placement="top">
              <el-checkbox-button value="deepseek">
                <span class="platform-icon">D</span>
              </el-checkbox-button>
            </el-tooltip>
            <el-tooltip content="豆包" placement="top">
              <el-checkbox-button value="doubao">
                <span class="platform-icon">豆</span>
              </el-checkbox-button>
            </el-tooltip>
            <el-tooltip content="文心一言" placement="top">
              <el-checkbox-button value="wenxin">
                <span class="platform-icon">文</span>
              </el-checkbox-button>
            </el-tooltip>
            <el-tooltip content="通义千问" placement="top">
              <el-checkbox-button value="tongyi">
                <span class="platform-icon">通</span>
              </el-checkbox-button>
            </el-tooltip>
            <el-tooltip content="Kimi" placement="top">
              <el-checkbox-button value="kimi">
                <span class="platform-icon">K</span>
              </el-checkbox-button>
            </el-tooltip>
            <el-tooltip content="元宝" placement="top">
              <el-checkbox-button value="yuanbao">
                <span class="platform-icon">元</span>
              </el-checkbox-button>
            </el-tooltip>
            <el-tooltip content="ChatGPT" placement="top">
              <el-checkbox-button value="chatgpt">
                <span class="platform-icon">C</span>
              </el-checkbox-button>
            </el-tooltip>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="isLoading" @click="handleSearch">查询</el-button>
          <el-button type="success" @click="dialogVisible = true">发起实时扫描</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="metric-card">
          <template #header>
            <div class="card-header">
              <span>平均可见性</span>
              <el-tag type="success">上升</el-tag>
            </div>
          </template>
          <div class="metric-value">
            <span class="value">{{ metrics?.avgVisibility?.toFixed(1) || 0 }}%</span>
            <span class="desc">品牌在各平台的平均可见程度</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="metric-card">
          <template #header>
            <div class="card-header">
              <span>首位提及率</span>
            </div>
          </template>
          <div class="metric-value">
            <span class="value">{{ metrics?.firstMentionRate?.toFixed(1) || 0 }}%</span>
            <span class="desc">品牌在回答中被首次提及的比例</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="metric-card">
          <template #header>
            <div class="card-header">
              <span>引用次数</span>
            </div>
          </template>
          <div class="metric-value">
            <span class="value">{{ metrics?.totalCitations || 0 }}</span>
            <span class="desc">品牌在回答中被引用的总次数</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="metric-card">
          <template #header>
            <div class="card-header">
              <span>监测平台数</span>
            </div>
          </template>
          <div class="metric-value">
            <span class="value">{{ metrics?.platformCount || 0 }}</span>
            <span class="desc">正在监测的 AI 平台数量</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 可见性趋势图 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>可见性趋势图</span>
        </div>
      </template>
      <VisibilityTrendChart :data="trendData" />
    </el-card>

    <!-- 平台对比表格 -->
    <el-card class="chart-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>平台对比表格</span>
        </div>
      </template>
      <el-table :data="platformData" stripe style="width: 100%">
        <el-table-column prop="platformName" label="平台名称" width="120"></el-table-column>
        <el-table-column prop="visibility" label="可见性得分">
          <template #default="scope">
            {{ scope.row.visibility }}%
          </template>
        </el-table-column>
        <el-table-column prop="isFirstMention" label="首位提及">
          <template #default="scope">
            <el-tag :type="scope.row.isFirstMention ? 'success' : 'info'">
              {{ scope.row.isFirstMention ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="citationCount" label="引用总数"></el-table-column>
        <el-table-column prop="trend" label="趋势">
          <template #default="scope">
            <span :style="{ color: scope.row.trend === 'up' ? '#67c23a' : '#f56c6c' }">
              {{ scope.row.trend === 'up' ? '上升' : '下降' }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 竞品对比雷达图 -->
    <el-card class="chart-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>竞品对比雷达图</span>
          <el-button size="small" @click="refreshCompetitorData">刷新数据</el-button>
        </div>
      </template>
      <CompetitorRadarChart :data="competitorData" :brand-name="currentBrandName" />
    </el-card>

    <!-- 扫描任务弹窗 -->
    <el-dialog v-model="dialogVisible" title="新建感知扫描任务" width="500px">
      <el-form :model="scanForm" label-width="100px">
        <el-form-item label="品牌名称">
          <el-input v-model="scanForm.brandName" placeholder="请输入品牌名称"></el-input>
        </el-form-item>
        <el-form-item label="模拟提问">
          <el-input
            v-model="scanForm.query"
            type="textarea"
            :rows="3"
            placeholder="请输入模拟用户提问话术"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="isScanning" @click="submitScan">开始扫描</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePerceptionStore } from '@/stores/perception'
import { ElMessage } from 'element-plus'
import VisibilityTrendChart from '../components/VisibilityTrendChart.vue'
import CompetitorRadarChart from '../components/CompetitorRadarChart.vue'

const perceptionStore = usePerceptionStore()

const selectedBrandId = ref<string>('')
const dateRange = ref<[Date, Date]>([
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  new Date()
])
const selectedPlatforms = ref<string[]>([])
const isLoading = ref(false)

const dialogVisible = ref(false)
const isScanning = ref(false)
const scanForm = ref({
  brandName: '',
  query: ''
})

const metrics = computed(() => perceptionStore.metrics)
const trendData = computed(() => perceptionStore.trendData)
const platformData = computed(() => perceptionStore.platformData)
const competitorData = computed(() => perceptionStore.competitorData)
const currentBrandName = computed(() => scanForm.value.brandName || 'AI副班')

onMounted(async () => {
  await perceptionStore.fetchDashboardData()
  await perceptionStore.fetchSupportedPlatforms()
})

const handleSearch = async () => {
  isLoading.value = true
  try {
    const filters: any = {}
    if (selectedBrandId.value) {
      filters.brandId = selectedBrandId.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      filters.startDate = dateRange.value[0].toISOString().split('T')[0]
      filters.endDate = dateRange.value[1].toISOString().split('T')[0]
    }
    if (selectedPlatforms.value.length > 0) {
      filters.platforms = selectedPlatforms.value
    }
    await perceptionStore.fetchDashboardData(filters)
  } finally {
    isLoading.value = false
  }
}

const refreshCompetitorData = async () => {
  if (selectedBrandId.value) {
    await perceptionStore.fetchCompetitorAnalysis(selectedBrandId.value)
    ElMessage.success('竞品数据已刷新')
  } else {
    ElMessage.warning('请先选择品牌')
  }
}

const submitScan = async () => {
  if (!scanForm.value.brandName || !scanForm.value.query) {
    ElMessage.warning('请填写品牌名称和模拟提问')
    return
  }
  
  isScanning.value = true
  try {
    await perceptionStore.triggerScan(scanForm.value.brandName, scanForm.value.query)
    ElMessage.success('扫描完成，大屏已更新')
    dialogVisible.value = false
    scanForm.value = { brandName: '', query: '' }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '扫描失败，请检查后端终端报错')
    console.error('扫描失败详情:', error)
  } finally {
    isScanning.value = false
  }
}
</script>

<style scoped>
.perception-dashboard {
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
}

.filter-card,
.chart-card,
.table-card,
.el-row {
  margin-bottom: 24px;
}

/* 平台图标按钮组样式 */
.platform-checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  transition: all 0.3s ease;
}

:deep(.el-checkbox-button.is-checked .platform-icon) {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

:deep(.el-checkbox-button__inner) {
  padding: 0;
  border: none;
  background: transparent;
}

:deep(.el-checkbox-button__inner:hover .platform-icon) {
  border-color: #409eff;
  color: #409eff;
}

/* 修复卡片滚动条问题 */
:deep(.el-card) {
  overflow: visible !important;
}

:deep(.el-card__body) {
  overflow: hidden !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
}

:deep(.el-card .metric-value) {
  flex: 1;
}

.metric-card {
  height: 150px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.desc {
  font-size: 12px;
  color: #666;
  text-align: center;
  padding-bottom: 4px;
}

.chart-card {
  min-height: 400px;
}

.chart-placeholder {
  width: 100%;
  height: 350px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.chart-placeholder p {
  color: #999;
  font-size: 14px;
}
</style>