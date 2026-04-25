import axios from 'axios';

const API_BASE_URL = '/api/generation';

export class GenerationService {
  /**
   * 生成内容
   * @param data 生成请求数据
   * @returns 生成的内容
   */
  static async generateContent(data: {
    brandId: string;
    strategyId: string;
    contentType: string;
    platform: string;
    parameters?: Record<string, any>;
  }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/content`, data);
      return response.data.data;
    } catch (error) {
      console.error('生成内容失败:', error);
      throw error;
    }
  }

  /**
   * 获取生成内容列表
   * @param params 查询参数
   * @returns 生成内容列表
   */
  static async getGeneratedContents(params: {
    brandId?: string;
    contentType?: string;
    platform?: string;
    status?: string;
  }) {
    try {
      const response = await axios.get(`${API_BASE_URL}/contents`, { params });
      return response.data.data;
    } catch (error) {
      console.error('获取生成内容列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取生成内容详情
   * @param id 内容ID
   * @returns 内容详情
   */
  static async getGeneratedContentById(id: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/contents/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('获取内容详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新内容状态
   * @param id 内容ID
   * @param status 新状态
   * @returns 更新后的内容
   */
  static async updateContentStatus(id: string, status: string) {
    try {
      const response = await axios.put(`${API_BASE_URL}/contents/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      console.error('更新内容状态失败:', error);
      throw error;
    }
  }

  /**
   * 删除生成内容
   * @param id 内容ID
   * @returns 删除结果
   */
  static async deleteGeneratedContent(id: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/contents/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('删除内容失败:', error);
      throw error;
    }
  }

  /**
   * 部署内容
   * @param id 内容ID
   * @returns 部署后的内容
   */
  static async deployContent(id: string) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/contents/${id}/deploy`);
      return response.data.data;
    } catch (error) {
      console.error('部署内容失败:', error);
      throw error;
    }
  }

  /**
   * 归档内容
   * @param id 内容ID
   * @returns 归档后的内容
   */
  static async archiveContent(id: string) {
    try {
      const response = await axios.put(`${API_BASE_URL}/contents/${id}/status`, { status: 'archived' });
      return response.data.data;
    } catch (error) {
      console.error('归档内容失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容统计信息
   * @param brandId 品牌ID
   * @returns 统计信息
   */
  static async getContentStatistics(brandId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics`, { params: { brandId } });
      return response.data.data;
    } catch (error) {
      console.error('获取内容统计信息失败:', error);
      throw error;
    }
  }
}
