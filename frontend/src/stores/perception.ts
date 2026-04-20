import { defineStore } from 'pinia'
import { perceptionApi, DashboardFilters, TrendDataPoint, PlatformData, CompetitorData } from '@/api/perception'

export const usePerceptionStore = defineStore('perception', {
  state: () => ({
    metrics: {
      avgVisibility: 0,
      firstMentionRate: 0,
      totalCitations: 0,
      platformCount: 0
    },
    trendData: [] as TrendDataPoint[],
    platformData: [] as PlatformData[],
    competitorData: [] as CompetitorData[],
    supportedPlatforms: [] as string[],
    loading: false
  }),

  actions: {
    async fetchDashboardData(filters?: DashboardFilters) {
      this.loading = true
      try {
        const response = await perceptionApi.getDashboardData(filters)
        this.metrics = response.metrics || {}
        this.trendData = response.trendData || []
        this.platformData = response.platformData || []
        this.competitorData = response.competitorData || []
      } catch (error) {
        console.error('获取仪表盘数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchSupportedPlatforms() {
      try {
        const response = await perceptionApi.getSupportedPlatforms()
        this.supportedPlatforms = response.platforms || []
      } catch (error) {
        console.error('获取支持的平台列表失败:', error)
      }
    },

    async fetchCompetitorAnalysis(brandId: string, queryId?: string) {
      try {
        const response = await perceptionApi.getCompetitorAnalysis(brandId, queryId)
        this.competitorData = response.competitors || []
        return response
      } catch (error) {
        console.error('获取竞品分析失败:', error)
        return null
      }
    },

    async triggerScan(brandName: string, query: string) {
      try {
        await perceptionApi.triggerScan(brandName, query)
        await this.fetchDashboardData()
      } catch (error) {
        console.error('扫描失败:', error)
        throw error
      }
    },

    async seedHistoricalData() {
      try {
        await perceptionApi.seedHistoricalData()
        await this.fetchDashboardData()
      } catch (error) {
        console.error('生成历史数据失败:', error)
        throw error
      }
    }
  }
})