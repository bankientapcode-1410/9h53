import apiClient from './apiClient';
import {
  CategoryTreeDTO,
  SpecMetadataDTO,
  ApiResponse,
} from '../features/product-catalog/types/product.types';
import { MOCK_CATEGORY_TREE, MOCK_SPECS_SCHEMA } from './mockData';

export const categoryService = {
  /**
   * GET /api/v1/categories
   * Lấy cấu trúc cây danh mục linh kiện 2 cấp
   */
  async getCategoryTree(): Promise<ApiResponse<CategoryTreeDTO[]>> {
    try {
      const response = await apiClient.get<ApiResponse<CategoryTreeDTO[]>>('/api/v1/categories');
      return response.data;
    } catch (error) {
      console.warn('[categoryService.getCategoryTree] API failed, using fallback category tree:', error);
      return {
        success: true,
        status_code: 200,
        message: 'Thành công (fallback)',
        data: MOCK_CATEGORY_TREE,
      };
    }
  },

  /**
   * GET /api/v1/categories/{categoryCode}/specs-schema
   * Lấy schema các trường thông số kỹ thuật (filterable & required)
   */
  async getCategorySpecsSchema(categoryCode: string): Promise<ApiResponse<SpecMetadataDTO>> {
    try {
      const response = await apiClient.get<ApiResponse<SpecMetadataDTO>>(
        `/api/v1/categories/${categoryCode}/specs-schema`
      );
      return response.data;
    } catch (error) {
      console.warn(`[categoryService.getCategorySpecsSchema] API failed for ${categoryCode}, using fallback schema:`, error);
      const schema = MOCK_SPECS_SCHEMA[categoryCode.toUpperCase()] || {
        category_code: categoryCode,
        category_name: categoryCode,
        has_schema: false,
        fields: [],
      };
      return {
        success: true,
        status_code: 200,
        message: 'Thành công (fallback)',
        data: schema,
      };
    }
  },
};
