import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/execution';

export class ExecutionService {
  /**
   * 部署内容
   * @param contentId 内容ID
   * @returns 部署结果
   */
  static async deployContent(contentId: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/deploy/${contentId}`);
      return response.data;
    } catch (error) {
      console.error('部署内容失败:', error);
      throw error;
    }
  }

  /**
   * 批量部署内容
   * @param contentIds 内容ID列表
   * @returns 批量部署结果
   */
  static async batchDeployContent(contentIds: string[]) {
    try {
      const response = await axios.post(`${API_BASE_URL}/deploy/batch`, { contentIds });
      return response.data;
    } catch (error) {
      console.error('批量部署内容失败:', error);
      throw error;
    }
  }

  /**
   * 更新内容部署状态
   * @param contentId 内容ID
   * @param status 新状态
   * @returns 更新后的内容
   */
  static async updateDeploymentStatus(contentId: string, status: string) {
    try {
      const response = await axios.put(`${API_BASE_URL}/status/${contentId}`, { status });
      return response.data;
    } catch (error) {
      console.error('更新部署状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取部署统计信息
   * @param brandId 品牌ID
   * @returns 部署统计
   */
  static async getDeploymentStatistics(brandId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics`, { params: { brandId } });
      return response.data;
    } catch (error) {
      console.error('获取部署统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容部署历史
   * @param contentId 内容ID
   * @returns 部署历史
   */
  static async getDeploymentHistory(contentId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/history/${contentId}`);
      return response.data;
    } catch (error) {
      console.error('获取部署历史失败:', error);
      throw error;
    }
  }
}
