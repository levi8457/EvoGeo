<template>
  <div v-if="data && data.length > 0" class="visibility-trend-chart" ref="chartRef"></div>
  <div v-else class="no-data-container">
    <div class="no-data-text">暂无数据</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

// 图表容器引用
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// Props 定义
const props = defineProps<{
  data: any[]
}>()

// 处理数据并更新图表
const updateChart = () => {
  if (!chartRef.value) return
  
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  
  // 提取日期和可见性数据
  const dates = props.data.map(item => item.date)
  const visibility = props.data.map(item => item.visibility)
  
  // 处理数据
  let option: echarts.EChartsOption
  option = {
      title: {
        text: '可见性趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}%'
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [{
        name: '可见性',
        type: 'line',
        data: visibility,
        smooth: true,
        lineStyle: {
          color: '#409EFF' // Element Plus 默认主题蓝
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(64, 158, 255, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(64, 158, 255, 0.1)'
            }
          ])
        },
        symbol: 'circle',
        symbolSize: 8
      }]
  }

  chart.setOption(option)
}

// 响应窗口大小变化
const handleResize = () => {
  chart?.resize()
}

// 监听数据变化
watch(() => props.data, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  updateChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.visibility-trend-chart {
  width: 100%;
  height: 350px;
}

.no-data-container {
  width: 100%;
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.no-data-text {
  font-size: 16px;
  font-weight: 600;
  color: #999;
}
</style>