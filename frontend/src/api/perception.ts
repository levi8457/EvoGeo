import axios from 'axios'

export interface DashboardFilters {
  brandId?: string
  startDate?: string
  endDate?: string
  platforms?: string[]
}

export interface TrendDataPoint {
  date: string
  visibility: number
}

export interface PlatformData {
  platformName: string
  visibility: number
  isFirstMention: boolean
  citationCount: number
  trend: 'up' | 'down'
}

export interface CompetitorData {
  name: string
  mentionCount: number
  platforms: string[]
}

export interface DashboardResponse {
  metrics: {
    avgVisibility: number
    firstMentionRate: number
    totalCitations: number
    platformCount: number
  }
  trendData: TrendDataPoint[]
  platformData: PlatformData[]
  competitorData: CompetitorData[]
}

export interface VisibilityRecord {
  id: string
  brandId: string
  queryId: string
  platformId: string
  isMentioned: boolean
  isFirstMention: boolean
  mentionPosition: number | null
  citationCount: number
  citationSnippet: string | null
  answerFullText: string | null
  collectedAt: string
  responseTimeMs: number | null
  platform?: {
    platformName: string
  }
  query?: {
    queryText: string
  }
}

export interface MonitoringQuery {
  id: string
  brandId: string
  queryText: string
  category: string
  priority: number
  isActive: boolean
  createdAt: string
}

export interface Brand {
  id: string
  name: string
  domain?: string
  industry?: string
  description?: string
}

export interface RunCheckResult {
  platformName: string
  responseText: string
  isMentioned: boolean
  isFirstMention: boolean
  mentionPosition: number | null
  responseTimeMs: number
  error?: string
}

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const perceptionApi = {
  async getDashboardData(filters?: DashboardFilters): Promise<DashboardResponse> {
    const response = await api.get('/perception/dashboard', {
      params: filters
    })
    return response.data
  },

  async getVisibilityRecords(
    brandId: string,
    startDate?: string,
    endDate?: string
  ): Promise<VisibilityRecord[]> {
    const response = await api.get('/perception/visibility-records', {
      params: { brandId, startDate, endDate }
    })
    return response.data
  },

  async runImmediateCheck(queryId: string, platforms: string[]): Promise<{
    success: boolean
    totalPlatforms: number
    successCount: number
    mentionedCount: number
    results: RunCheckResult[]
  }> {
    const response = await api.post('/perception/run-check', {
      queryId,
      platforms
    })
    return response.data
  },

  async getCompetitorAnalysis(brandId: string, queryId?: string): Promise<{
    brandId: string
    brandName: string
    queryId?: string
    totalRecords: number
    competitors: CompetitorData[]
  }> {
    const response = await api.get('/perception/competitor-analysis', {
      params: { brandId, queryId }
    })
    return response.data
  },

  async getSupportedPlatforms(): Promise<{ platforms: string[] }> {
    const response = await api.get('/perception/platforms')
    return response.data
  },

  async getEnabledPlatforms(): Promise<any[]> {
    const response = await api.get('/perception/platforms/enabled')
    return response.data
  },

  async testPlatformConnection(name: string): Promise<{ success: boolean; message: string }> {
    const response = await api.get(`/perception/platforms/${name}/test`)
    return response.data
  },

  async triggerScan(brandName: string, query: string): Promise<any> {
    const response = await api.post('/perception/scan', {
      brandName,
      query
    }, { timeout: 60000 })
    return response.data
  },

  async seedHistoricalData(): Promise<{ message: string }> {
    const response = await api.get('/perception/seed-history')
    return response.data
  },

  async getBrands(): Promise<Brand[]> {
    const response = await api.get('/perception/brands')
    return response.data
  },

  async getQueries(brandId?: string): Promise<any[]> {
    const response = await api.get('/perception/queries', {
      params: { brandId }
    })
    return response.data
  },

  async getQueryById(id: string): Promise<any> {
    const response = await api.get(`/perception/queries/${id}`)
    return response.data
  },

  async createQuery(data: { brandId: string; queryText: string; category?: string; priority?: number }): Promise<MonitoringQuery> {
    const response = await api.post('/perception/queries', data)
    return response.data
  },

  async updateQuery(id: string, data: { queryText?: string; category?: string; priority?: number; isActive?: boolean }): Promise<MonitoringQuery> {
    const response = await api.put(`/perception/queries/${id}`, data)
    return response.data
  },

  async deleteQuery(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/perception/queries/${id}`)
    return response.data
  }
}