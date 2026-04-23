import axios from 'axios';

const API_BASE_URL = '/api/memory';

export class MemoryService {
  /**
   * 创建记忆条目
   * @param data 记忆条目数据
   * @returns 创建的记忆条目
   */
  static async createMemoryEntry(data: {
    brandId: string;
    memoryType: string;
    memoryKey: string;
    content: string;
    metadata?: Record<string, any>;
    importance?: number;
  }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/entries`, data);
      return response.data.data;
    } catch (error) {
      console.error('创建记忆条目失败:', error);
      throw error;
    }
  }

  /**
   * 获取记忆条目列表
   * @param params 查询参数
   * @returns 记忆条目列表
   */
  static async getMemoryEntries(params: {
    brandId?: string;
    memoryType?: string;
    importance?: number;
  }) {
    try {
      const response = await axios.get(`${API_BASE_URL}/entries`, { params });
      return response.data.data;
    } catch (error) {
      console.error('获取记忆条目列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取记忆条目详情
   * @param id 记忆条目ID
   * @returns 记忆条目详情
   */
  static async getMemoryEntryById(id: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/entries/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('获取记忆条目详情失败:', error);
      throw error;
    }
  }

  /**
   * 根据键获取记忆条目
   * @param brandId 品牌ID
   * @param memoryKey 记忆键
   * @returns 记忆条目
   */
  static async getMemoryEntryByKey(brandId: string, memoryKey: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/entries/by-key`, {
        params: { brandId, memoryKey },
      });
      return response.data.data;
    } catch (error) {
      console.error('根据键获取记忆条目失败:', error);
      throw error;
    }
  }

  /**
   * 更新记忆条目
   * @param id 记忆条目ID
   * @param data 更新数据
   * @returns 更新后的记忆条目
   */
  static async updateMemoryEntry(id: string, data: {
    memoryType?: string;
    memoryKey?: string;
    content?: string;
    metadata?: Record<string, any>;
    importance?: number;
  }) {
    try {
      const response = await axios.put(`${API_BASE_URL}/entries/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('更新记忆条目失败:', error);
      throw error;
    }
  }

  /**
   * 删除记忆条目
   * @param id 记忆条目ID
   * @returns 删除结果
   */
  static async deleteMemoryEntry(id: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/entries/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('删除记忆条目失败:', error);
      throw error;
    }
  }

  /**
   * 获取记忆统计信息
   * @param brandId 品牌ID
   * @returns 统计信息
   */
  static async getMemoryStatistics(brandId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics`, { params: { brandId } });
      return response.data.data;
    } catch (error) {
      console.error('获取记忆统计信息失败:', error);
      throw error;
    }
  }
}
