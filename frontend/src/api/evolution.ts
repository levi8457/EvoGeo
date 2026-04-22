import axios from 'axios';

const API_BASE_URL = '/api/evolution';

interface Strategy {
  id: string;
  brandId: string;
  strategyType: string;
  contentTemplate: string;
  parameters: Record<string, any>;
  generation: number;
  fitnessScore: number;
  status: string;
  createdAt: string;
}

interface StrategyCreate {
  brandId: string;
  strategyType: string;
  contentTemplate: string;
  parameters?: Record<string, any>;
  archiveDimension1?: string;
  archiveDimension2?: string;
}

interface StrategyUpdate {
  contentTemplate?: string;
  parameters?: Record<string, any>;
  status?: string;
}

interface EvaluateStrategy {
  strategyId: string;
  queryId: string;
  predictedScore: number;
  actualScore: number;
  features?: Record<string, any>;
  feedbackText?: string;
}

interface DashboardData {
  generationStats: Array<{
    generation: number;
    strategies: number;
    avgFitness: number;
    maxFitness: number;
    minFitness: number;
  }>;
  topStrategies: Strategy[];
  totalStrategies: number;
  totalEvaluations: number;
  evaluationStats?: {
    totalEvaluations: number;
    avgFitness: number;
    avgError: number;
    maxFitness: number;
    minFitness: number;
    errorDistribution: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

export const EvolutionService = {
  async getStrategies(brandId?: string, strategyType?: string): Promise<Strategy[]> {
    const params = new URLSearchParams();
    if (brandId) params.append('brandId', brandId);
    if (strategyType) params.append('strategyType', strategyType);
    
    const response = await axios.get(`${API_BASE_URL}/strategies`, { params });
    return response.data.data;
  },

  async getStrategyById(id: string): Promise<Strategy> {
    const response = await axios.get(`${API_BASE_URL}/strategies/${id}`);
    return response.data.data;
  },

  async createStrategy(dto: StrategyCreate): Promise<Strategy> {
    const response = await axios.post(`${API_BASE_URL}/strategies`, dto);
    return response.data.data;
  },

  async updateStrategy(id: string, dto: StrategyUpdate): Promise<Strategy> {
    const response = await axios.put(`${API_BASE_URL}/strategies/${id}`, dto);
    return response.data.data;
  },

  async deleteStrategy(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/strategies/${id}`);
    return response.data.data;
  },

  async evolveStrategy(
    strategyId: string, 
    mutationRate?: number, 
    crossoverRate?: number
  ): Promise<Strategy> {
    const response = await axios.post(`${API_BASE_URL}/strategies/${strategyId}/evolve`, {
      mutationRate,
      crossoverRate,
    });
    return response.data.data;
  },

  async evaluateStrategy(dto: EvaluateStrategy): Promise<{
    strategy: Strategy;
    feedback: any;
  }> {
    const response = await axios.post(`${API_BASE_URL}/strategies/${dto.strategyId}/evaluate`, dto);
    return response.data.data;
  },

  async getDashboard(brandId: string, timeRange?: string): Promise<DashboardData> {
    const params = new URLSearchParams();
    if (timeRange) params.append('timeRange', timeRange);
    
    const response = await axios.get(`${API_BASE_URL}/dashboard?brandId=${brandId}`, { params });
    return response.data.data;
  },

  async getCriticFeedback(strategyId?: string, queryId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (strategyId) params.append('strategyId', strategyId);
    if (queryId) params.append('queryId', queryId);
    
    const response = await axios.get(`${API_BASE_URL}/critic/feedback`, { params });
    return response.data.data;
  },

  async createCriticFeedback(dto: EvaluateStrategy): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/critic/feedback`, dto);
    return response.data.data;
  },

  async getCriticStats(strategyId?: string, timeRange?: string): Promise<any> {
    const params = new URLSearchParams();
    if (strategyId) params.append('strategyId', strategyId);
    if (timeRange) params.append('timeRange', timeRange);

    const response = await axios.get(`${API_BASE_URL}/critic/stats`, { params });
    return response.data.data;
  },

  async getArchiveData(brandId: string, dimension1?: string, dimension2?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('brandId', brandId);
    if (dimension1) params.append('dimension1', dimension1);
    if (dimension2) params.append('dimension2', dimension2);

    const response = await axios.get(`${API_BASE_URL}/archive`, { params });
    return response.data.data;
  },

  async getArchiveStatistics(brandId: string): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/archive/statistics?brandId=${brandId}`);
    return response.data.data;
  },
};
