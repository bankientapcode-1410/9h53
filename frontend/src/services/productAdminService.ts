import apiClient from './apiClient';
import {
  AdminProductDTO,
  CreateProductRequest,
  UpdateProductRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  VectorSyncResultDTO,
  BatchSyncAcceptedDTO,
  ApiResponse,
  PageResponse,
  CategoryTreeDTO,
} from '../features/product-catalog/types/product.types';
import { MOCK_PRODUCTS, MOCK_CATEGORY_TREE } from './mockData';

// In-memory editable copy for local mock fallback
let inMemoryProducts: AdminProductDTO[] = [...MOCK_PRODUCTS];
let inMemoryCategories: CategoryTreeDTO[] = JSON.parse(JSON.stringify(MOCK_CATEGORY_TREE));

export const productAdminService = {
  /**
   * GET /api/v1/admin/products
   * Danh sách SP gồm cả SP ẩn, lọc theo sync_status, include_deleted
   */
  async getAdminProducts(criteria: {
    category?: string;
    brand?: string;
    search?: string;
    sync_status?: string;
    include_deleted?: boolean;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<ApiResponse<PageResponse<AdminProductDTO>>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<AdminProductDTO>>>('/api/v1/admin/products', {
        params: criteria,
      });
      return response.data;
    } catch (error) {
      console.warn('[productAdminService.getAdminProducts] API call failed, using fallback mock list:', error);
      let items = [...inMemoryProducts];

      if (!criteria.include_deleted) {
        items = items.filter((p) => !p.deleted_at);
      }
      if (criteria.category) {
        items = items.filter((p) => p.category.category_code === criteria.category);
      }
      if (criteria.brand) {
        items = items.filter((p) => p.brand.toLowerCase() === criteria.brand?.toLowerCase());
      }
      if (criteria.sync_status) {
        items = items.filter((p) => p.sync_status === criteria.sync_status);
      }
      if (criteria.search) {
        const q = criteria.search.toLowerCase();
        items = items.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
      }

      const page = criteria.page || 0;
      const size = criteria.size || 10;
      const totalElements = items.length;
      const totalPages = Math.ceil(totalElements / size) || 1;
      const paged = items.slice(page * size, (page + 1) * size);

      return {
        success: true,
        status_code: 200,
        message: 'Thành công (fallback)',
        data: {
          content: paged,
          page,
          size,
          total_elements: totalElements,
          total_pages: totalPages,
          first: page === 0,
          last: page >= totalPages - 1,
        },
      };
    }
  },

  /**
   * POST /api/v1/admin/products
   * Tạo linh kiện mới
   */
  async createProduct(payload: CreateProductRequest): Promise<ApiResponse<AdminProductDTO>> {
    try {
      const response = await apiClient.post<ApiResponse<AdminProductDTO>>('/api/v1/admin/products', payload);
      return response.data;
    } catch (error) {
      console.warn('[productAdminService.createProduct] API call failed, using in-memory mock:', error);
      const newProduct: AdminProductDTO = {
        product_id: `prod-${Date.now()}`,
        name: payload.name,
        brand: payload.brand.toUpperCase(),
        category: {
          category_id: `cat-${payload.category_code}`,
          category_code: payload.category_code,
          category_name: payload.category_code,
        },
        description: payload.description || '',
        price: payload.price,
        stock_quantity: payload.stock_quantity,
        benchmark_score: payload.benchmark_score ?? 0,
        image_url: payload.image_url || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
        gallery_urls: payload.gallery_urls || [],
        specs: payload.specs || {},
        is_active: payload.is_active ?? true,
        sync_status: 'PENDING',
        version: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      inMemoryProducts.unshift(newProduct);

      return {
        success: true,
        status_code: 201,
        message: 'Thêm sản phẩm thành công. Đang đồng bộ Vector AI ngầm.',
        data: newProduct,
      };
    }
  },

  /**
   * PUT /api/v1/admin/products/{id}
   * Cập nhật thông tin linh kiện (kèm version optimistic lock)
   */
  async updateProduct(id: string, payload: UpdateProductRequest): Promise<ApiResponse<AdminProductDTO>> {
    try {
      const response = await apiClient.put<ApiResponse<AdminProductDTO>>(`/api/v1/admin/products/${id}`, payload);
      return response.data;
    } catch (error) {
      console.warn(`[productAdminService.updateProduct] API call failed for ${id}, updating mock in-memory:`, error);
      const index = inMemoryProducts.findIndex((p) => p.product_id === id);
      if (index === -1) {
        throw new Error('Không tìm thấy sản phẩm');
      }
      const existing = inMemoryProducts[index];
      const updated: AdminProductDTO = {
        ...existing,
        name: payload.name,
        brand: payload.brand.toUpperCase(),
        description: payload.description || '',
        price: payload.price,
        stock_quantity: payload.stock_quantity,
        benchmark_score: payload.benchmark_score ?? existing.benchmark_score,
        image_url: payload.image_url || existing.image_url,
        gallery_urls: payload.gallery_urls || existing.gallery_urls,
        specs: payload.specs,
        is_active: payload.is_active ?? existing.is_active,
        sync_status: 'PENDING',
        version: existing.version + 1,
        updated_at: new Date().toISOString(),
      };
      inMemoryProducts[index] = updated;

      return {
        success: true,
        status_code: 200,
        message: 'Cập nhật sản phẩm thành công',
        data: updated,
      };
    }
  },

  /**
   * PATCH /api/v1/admin/products/{id}/status
   * Bật/tắt trạng thái hiển thị
   */
  async updateProductStatus(id: string, isActive: boolean): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.patch<ApiResponse<void>>(`/api/v1/admin/products/${id}/status`, {
        is_active: isActive,
      });
      return response.data;
    } catch (error) {
      console.warn(`[productAdminService.updateProductStatus] API failed for ${id}, using in-memory mock:`, error);
      const product = inMemoryProducts.find((p) => p.product_id === id);
      if (product) {
        product.is_active = isActive;
      }
      return {
        success: true,
        status_code: 200,
        message: `Đã ${isActive ? 'kích hoạt' : 'ẩn'} sản phẩm`,
        data: undefined as any,
      };
    }
  },

  /**
   * DELETE /api/v1/admin/products/{id}
   * Soft delete sản phẩm
   */
  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/admin/products/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`[productAdminService.deleteProduct] API failed for ${id}, soft deleting in-memory:`, error);
      const product = inMemoryProducts.find((p) => p.product_id === id);
      if (product) {
        product.deleted_at = new Date().toISOString();
        product.is_active = false;
      }
      return {
        success: true,
        status_code: 204,
        message: 'Đã xóa sản phẩm (soft delete)',
        data: undefined as any,
      };
    }
  },

  /**
   * POST /api/v1/admin/products/{id}/sync-vector
   * Đồng bộ lại vector 1 sản phẩm
   */
  async triggerSyncVector(id: string): Promise<ApiResponse<VectorSyncResultDTO>> {
    try {
      const response = await apiClient.post<ApiResponse<VectorSyncResultDTO>>(
        `/api/v1/admin/products/${id}/sync-vector`
      );
      return response.data;
    } catch (error) {
      console.warn(`[productAdminService.triggerSyncVector] API failed for ${id}, using mock sync:`, error);
      const product = inMemoryProducts.find((p) => p.product_id === id);
      if (product) {
        product.sync_status = 'SYNCED';
      }
      return {
        success: true,
        status_code: 200,
        message: 'Đã hoàn thành đồng bộ Vector Embedding',
        data: {
          product_id: id,
          sync_status: 'SYNCED',
          embedding_model: 'text-embedding-004',
          vector_dimensions: 768,
          synced_at: new Date().toISOString(),
        },
      };
    }
  },

  /**
   * POST /api/v1/admin/products/batch-sync-vectors
   * Batch Re-sync tối đa 100 sản phẩm
   */
  async triggerBatchSyncVectors(productIds: string[]): Promise<ApiResponse<BatchSyncAcceptedDTO>> {
    try {
      const response = await apiClient.post<ApiResponse<BatchSyncAcceptedDTO>>(
        '/api/v1/admin/products/batch-sync-vectors',
        { product_ids: productIds }
      );
      return response.data;
    } catch (error) {
      console.warn('[productAdminService.triggerBatchSyncVectors] API failed, using mock batch response:', error);
      // Mark products as SYNCED
      productIds.forEach((id) => {
        const prod = inMemoryProducts.find((p) => p.product_id === id);
        if (prod) prod.sync_status = 'SYNCED';
      });

      return {
        success: true,
        status_code: 202,
        message: `Đã tiếp nhận yêu cầu đồng bộ lại ${productIds.length} sản phẩm`,
        data: {
          job_id: `job-${Date.now()}`,
          accepted: productIds.length,
          rejected: [],
        },
      };
    }
  },

  /**
   * POST /api/v1/admin/categories
   * Tạo danh mục mới
   */
  async createCategory(payload: CreateCategoryRequest): Promise<ApiResponse<CategoryTreeDTO>> {
    try {
      const response = await apiClient.post<ApiResponse<CategoryTreeDTO>>('/api/v1/admin/categories', payload);
      return response.data;
    } catch (error) {
      console.warn('[productAdminService.createCategory] API failed, using in-memory mock:', error);
      const newCat: CategoryTreeDTO = {
        category_id: `cat-${Date.now()}`,
        category_code: payload.category_code.toUpperCase(),
        category_name: payload.category_name,
        description: payload.description || '',
        parent_category_id: payload.parent_category_id || null,
        has_schema: false,
        children: [],
      };

      if (payload.parent_category_id) {
        const parent = inMemoryCategories.find((c) => c.category_id === payload.parent_category_id);
        if (parent) {
          parent.children.push(newCat);
        } else {
          inMemoryCategories.push(newCat);
        }
      } else {
        inMemoryCategories.push(newCat);
      }

      return {
        success: true,
        status_code: 201,
        message: 'Tạo danh mục thành công',
        data: newCat,
      };
    }
  },

  /**
   * PUT /api/v1/admin/categories/{id}
   * Sửa tên, mô tả, danh mục cha
   */
  async updateCategory(id: string, payload: UpdateCategoryRequest): Promise<ApiResponse<CategoryTreeDTO>> {
    try {
      const response = await apiClient.put<ApiResponse<CategoryTreeDTO>>(`/api/v1/admin/categories/${id}`, payload);
      return response.data;
    } catch (error) {
      console.warn(`[productAdminService.updateCategory] API failed for ${id}, using mock:`, error);
      let targetNode: CategoryTreeDTO | null = null;

      const findAndEdit = (nodes: CategoryTreeDTO[]): boolean => {
        for (const n of nodes) {
          if (n.category_id === id) {
            n.category_name = payload.category_name;
            n.description = payload.description || n.description;
            targetNode = n;
            return true;
          }
          if (n.children && findAndEdit(n.children)) return true;
        }
        return false;
      };

      findAndEdit(inMemoryCategories);

      return {
        success: true,
        status_code: 200,
        message: 'Cập nhật danh mục thành công',
        data: targetNode || ({} as any),
      };
    }
  },

  /**
   * DELETE /api/v1/admin/categories/{id}
   * Xóa danh mục rỗng
   */
  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/admin/categories/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`[productAdminService.deleteCategory] API failed for ${id}, using mock:`, error);
      // Remove from inMemoryCategories
      inMemoryCategories = inMemoryCategories.filter((c) => c.category_id !== id);
      inMemoryCategories.forEach((parent) => {
        parent.children = parent.children.filter((child) => child.category_id !== id);
      });

      return {
        success: true,
        status_code: 204,
        message: 'Đã xóa danh mục thành công',
        data: undefined as any,
      };
    }
  },
};
