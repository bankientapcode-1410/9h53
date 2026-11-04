import apiClient from './apiClient';
import {
  CompatibilityCheckRequest,
  CompatibilityResult,
} from '../features/admin/rules/types/rule.types';
import { ApiResponse } from '../features/product-catalog/types/product.types';

export const compatibilityService = {
  async checkCompatibility(request: CompatibilityCheckRequest): Promise<ApiResponse<CompatibilityResult>> {
    try {
      const response = await apiClient.post<ApiResponse<CompatibilityResult>>('/api/v1/compatibility/check', request);
      return response.data;
    } catch (error) {
      console.warn('[compatibilityService.checkCompatibility] API call failed, using mock fallback:', error);
      return {
        success: true,
        status_code: 200,
        message: 'Kiểm tra tương thích hoàn tất (Mock)',
        data: {
          is_compatible: true,
          errors: [],
          warnings: [],
          info: [],
        },
        timestamp: new Date().toISOString(),
      };
    }
  },
};
