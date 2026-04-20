// 感知层模块的类型定义

// 仪表盘筛选条件
export interface DashboardFilters {
  brandId?: string;
  startDate?: string;
  endDate?: string;
  platforms?: string[];
}

// 趋势数据点
export interface TrendDataPoint {
  date: string;
  visibility: number;
}

// 平台数据
export interface PlatformData {
  platformName: string;
  visibility: number;
  isFirstMention: boolean;
  citationCount: number;
  trend: 'up' | 'down';
}

// 竞品数据
export interface CompetitorData {
  competitor: string;
  visibility: number;
  mentions: number;
}

// 仪表盘响应数据
export interface DashboardResponse {
  metrics: {
    avgVisibility: number;
    firstMentionRate: number;
    totalCitations: number;
    platformCount: number;
  };
  trendData: TrendDataPoint[];
  platformData: PlatformData[];
  competitorData: CompetitorData[];
}
