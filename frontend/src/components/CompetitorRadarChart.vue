<template>
  <div ref="chartRef" class="competitor-radar-chart"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

interface CompetitorData {
  name: string
  mentionCount: number
  platforms: string[]
}

const props = defineProps<{
  data: CompetitorData[]
  brandName?: string
}>()

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const indicators = [
    { name: '提及次数', max: 100 },
    { name: '平台覆盖', max: 7 },
    { name: '首位提及', max: 100 },
    { name: '引用深度', max: 100 },
    { name: '响应速度', max: 100 },
  ]

  const seriesData = props.data.slice(0, 5).map((item) => ({
    value: [
      Math.min(item.mentionCount * 10, 100),
      item.platforms.length,
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 100,
    ],
    name: item.name,
  }))

  const option: echarts.EChartsOption = {
    title: {
      text: props.brandName ? `${props.brandName} vs 竞品` : '竞品对比分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      data: seriesData.map((d) => d.name),
      bottom: 10,
    },
    radar: {
      indicator: indicators,
      center: ['50%', '50%'],
      radius: '60%',
      axisName: {
        color: '#666',
        fontSize: 12,
      },
      splitArea: {
        areaStyle: {
          color: ['#f5f7fa', '#fff'],
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: seriesData,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
        },
        areaStyle: {
          opacity: 0.2,
        },
      },
    ],
    color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

watch(
  () => props.data,
  () => {
    initChart()
  },
  { deep: true }
)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.competitor-radar-chart {
  width: 100%;
  height: 350px;
}
</style>
