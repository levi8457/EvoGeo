import axios from 'axios';

const API_BASE_URL = '/api/compliance';

export class ComplianceService {
  /**
   * 执行合规检测
   * @param contentId 内容ID
   * @returns 检测结果
   */
  static async runComplianceCheck(contentId: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/check/${contentId}`);
      return response.data.data;
    } catch (error) {
      console.error('执行合规检测失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容的合规检测结果
   * @param contentId 内容ID
   * @returns 检测结果列表
   */
  static async getComplianceChecks(contentId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/checks/${contentId}`);
      return response.data.data;
    } catch (error) {
      console.error('获取合规检测结果失败:', error);
      throw error;
    }
  }

  /**
   * 获取合规检测统计信息
   * @param brandId 品牌ID
   * @returns 统计信息
   */
  static async getComplianceStatistics(brandId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics`, { params: { brandId } });
      return response.data.data;
    } catch (error) {
      console.error('获取合规统计失败:', error);
      throw error;
    }
  }

  /**
   * 重新执行合规检测
   * @param contentId 内容ID
   * @returns 新的检测结果
   */
  static async reRunComplianceCheck(contentId: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/recheck/${contentId}`);
      return response.data.data;
    } catch (error) {
      console.error('重新执行合规检测失败:', error);
      throw error;
    }
  }
}
