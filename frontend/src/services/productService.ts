import apiClient from './apiClient';
import {
  ProductFilterCriteria,
  ApiResponse,
  PageResponse,
  ProductSummaryDTO,
  ProductDetailDTO,
  FacetFilterGroupDTO,
} from '../features/product-catalog/types/product.types';
import { MOCK_PRODUCTS } from './mockData';

export const productService = {
  /**
   * GET /api/v1/products
   * Duyệt sản phẩm kèm lọc Quick Chips, Whitelist specs, dải giá, phân trang
   */
  async getProducts(criteria: ProductFilterCriteria): Promise<ApiResponse<PageResponse<ProductSummaryDTO>>> {
    try {
      const params = new URLSearchParams();

      if (criteria.category) params.append('category', criteria.category);
      if (criteria.brand) {
        const brands = Array.isArray(criteria.brand) ? criteria.brand.join(',') : criteria.brand;
        if (brands) params.append('brand', brands);
      }
      if (criteria.min_price !== undefined) params.append('min_price', String(criteria.min_price));
      if (criteria.max_price !== undefined) params.append('max_price', String(criteria.max_price));
      if (criteria.sort) params.append('sort', criteria.sort);
      if (criteria.page !== undefined) params.append('page', String(criteria.page));
      if (criteria.size !== undefined) params.append('size', String(criteria.size));
      if (criteria.search) params.append('search', criteria.search);

      // Serialize specs[key]
      if (criteria.specs) {
        Object.entries(criteria.specs).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            const strVal = Array.isArray(val) ? val.join(',') : String(val);
            params.append(`specs[${key}]`, strVal);
          }
        });
      }

      const response = await apiClient.get<ApiResponse<PageResponse<ProductSummaryDTO>>>('/api/v1/products', {
        params,
      });
      return response.data;
    } catch (error) {
      console.warn('[productService.getProducts] Failed to call API, using fallback data:', error);
      // Fallback mock filtering
      let items = [...MOCK_PRODUCTS].filter((p) => p.is_active && !p.deleted_at);

      if (criteria.category) {
        items = items.filter((p) => p.category.category_code.toLowerCase() === criteria.category?.toLowerCase());
      }
      if (criteria.brand) {
        const brandArr = Array.isArray(criteria.brand)
          ? criteria.brand.map((b) => b.toUpperCase())
          : criteria.brand.split(',').map((b) => b.trim().toUpperCase());
        if (brandArr.length > 0 && brandArr[0] !== '') {
          items = items.filter((p) => brandArr.includes(p.brand.toUpperCase()));
        }
      }
      if (criteria.min_price !== undefined) {
        items = items.filter((p) => p.price >= (criteria.min_price || 0));
      }
      if (criteria.max_price !== undefined) {
        items = items.filter((p) => p.price <= (criteria.max_price || Infinity));
      }
      if (criteria.specs) {
        Object.entries(criteria.specs).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            const allowed = Array.isArray(v) ? v.map(String) : String(v).split(',').map((s) => s.trim());
            items = items.filter((p) => {
              const specVal = p.specs[k];
              if (specVal === undefined || specVal === null) return false;
              if (Array.isArray(specVal)) {
                return specVal.some((item) => allowed.includes(String(item)));
              }
              return allowed.includes(String(specVal));
            });
          }
        });
      }
      if (criteria.search) {
        const q = criteria.search.toLowerCase();
        items = items.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
      }

      // Sort
      if (criteria.sort === 'price_asc') {
        items.sort((a, b) => a.price - b.price);
      } else if (criteria.sort === 'price_desc') {
        items.sort((a, b) => b.price - a.price);
      } else if (criteria.sort === 'benchmark_desc') {
        items.sort((a, b) => b.benchmark_score - a.benchmark_score);
      } else {
        // newest
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      const page = criteria.page || 0;
      const size = criteria.size || 12;
      const totalElements = items.length;
      const totalPages = Math.ceil(totalElements / size) || 1;
      const pagedItems = items.slice(page * size, (page + 1) * size);

      const summaries: ProductSummaryDTO[] = pagedItems.map((p) => ({
        product_id: p.product_id,
        name: p.name,
        brand: p.brand,
        category_code: p.category.category_code,
        category_name: p.category.category_name,
        image_url: p.image_url || '',
        price: p.price,
        in_stock: p.stock_quantity > 0,
        benchmark_score: p.benchmark_score,
        key_specs: { ...p.specs },
      }));

      return {
        success: true,
        status_code: 200,
        message: 'Lấy danh sách sản phẩm thành công (local fallback)',
        data: {
          content: summaries,
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
   * GET /api/v1/products/{id}
   * Chi tiết sản phẩm đang bán
   */
  async getProductById(id: string): Promise<ApiResponse<ProductDetailDTO>> {
    try {
      const response = await apiClient.get<ApiResponse<ProductDetailDTO>>(`/api/v1/products/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`[productService.getProductById] API call failed for id ${id}, using fallback data:`, error);
      const found = MOCK_PRODUCTS.find((p) => p.product_id === id);
      if (!found) {
        throw new Error('Sản phẩm không tồn tại');
      }

      const detail: ProductDetailDTO = {
        product_id: found.product_id,
        name: found.name,
        brand: found.brand,
        category: found.category,
        description: found.description || '',
        price: found.price,
        in_stock: found.stock_quantity > 0,
        benchmark_score: found.benchmark_score,
        image_url: found.image_url || '',
        gallery_urls: found.gallery_urls || [],
        specs: found.specs,
        spec_labels: {
          socket_type: { label: 'Socket CPU', unit: null },
          supported_sockets: { label: 'Socket hỗ trợ', unit: null },
          tdp_w: { label: 'Công suất tiêu thụ (TDP)', unit: 'W' },
          core_count: { label: 'Số nhân (Cores)', unit: 'nhân' },
          thread_count: { label: 'Số luồng (Threads)', unit: 'luồng' },
          integrated_graphics: { label: 'Đồ họa tích hợp (iGPU)', unit: null },
          vram_gb: { label: 'Dung lượng VRAM', unit: 'GB' },
          vram_type: { label: 'Loại bộ nhớ VRAM', unit: null },
          length_mm: { label: 'Chiều dài card', unit: 'mm' },
          recommended_psu_w: { label: 'Công suất nguồn khuyến nghị', unit: 'W' },
          pcie_gen: { label: 'Chuẩn giao tiếp PCIe', unit: null },
          max_pcie_gen: { label: 'Chuẩn PCIe tối đa', unit: null },
          outputs: { label: 'Cổng xuất hình', unit: null },
          form_factor: { label: 'Kích thước (Form Factor)', unit: null },
          supported_form_factors: { label: 'Hỗ trợ Mainboard', unit: null },
          supported_memory_types: { label: 'Chuẩn RAM hỗ trợ', unit: null },
          ram_slots: { label: 'Số khe cắm RAM', unit: 'khe' },
          max_ram_gb: { label: 'Dung lượng RAM tối đa', unit: 'GB' },
          m2_slots: { label: 'Số khe cắm M.2', unit: 'khe' },
          chipset: { label: 'Chipset', unit: null },
          memory_type: { label: 'Chuẩn bộ nhớ RAM', unit: null },
          capacity_gb: { label: 'Dung lượng', unit: 'GB' },
          bus_speed_mhz: { label: 'Tốc độ Bus', unit: 'MHz' },
          modules_per_kit: { label: 'Số thanh mỗi Kit', unit: 'thanh' },
          interface_type: { label: 'Chuẩn kết nối', unit: null },
          read_speed_mbps: { label: 'Tốc độ đọc tối đa', unit: 'MB/s' },
          rated_wattage_w: { label: 'Công suất định mức', unit: 'W' },
          efficiency_rating: { label: 'Chuẩn hiệu suất 80 Plus', unit: null },
          max_gpu_length_mm: { label: 'Chiều dài VGA tối đa', unit: 'mm' },
          max_cooler_height_mm: { label: 'Chiều cao tản nhiệt tối đa', unit: 'mm' },
          cooler_type: { label: 'Loại tản nhiệt', unit: null },
          height_mm: { label: 'Chiều cao tản nhiệt', unit: 'mm' },
        },
        created_at: found.created_at,
      };

      return {
        success: true,
        status_code: 200,
        message: 'Thành công',
        data: detail,
      };
    }
  },

  /**
   * GET /api/v1/products/facets?category={categoryCode}
   * Danh sách Quick Chips & dải giá sinh động từ DB
   */
  async getFacets(categoryCode: string): Promise<ApiResponse<FacetFilterGroupDTO[]>> {
    try {
      const response = await apiClient.get<ApiResponse<FacetFilterGroupDTO[]>>('/api/v1/products/facets', {
        params: { category: categoryCode },
      });
      return response.data;
    } catch (error) {
      console.warn(`[productService.getFacets] API call failed for category ${categoryCode}, generating fallback facets:`, error);
      const catProducts = MOCK_PRODUCTS.filter(
        (p) => p.category.category_code.toUpperCase() === categoryCode.toUpperCase()
      );

      // Brands facet
      const brandCounts: Record<string, number> = {};
      catProducts.forEach((p) => {
        brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
      });
      const brandOptions = Object.entries(brandCounts).map(([brand, count]) => ({
        label: brand,
        value: brand,
        count,
      }));

      const facets: FacetFilterGroupDTO[] = [
        {
          code: 'brand',
          label: 'Thương hiệu',
          filter_type: 'CHIP',
          options: brandOptions,
        },
      ];

      // Dynamic spec facets based on category
      if (categoryCode === 'CPU') {
        const socketCounts: Record<string, number> = {};
        catProducts.forEach((p) => {
          const s = p.specs.socket_type;
          if (s) socketCounts[s] = (socketCounts[s] || 0) + 1;
        });
        facets.push({
          code: 'socket_type',
          label: 'Socket',
          filter_type: 'CHIP',
          options: Object.entries(socketCounts).map(([s, count]) => ({
            label: s,
            value: s,
            count,
          })),
        });
      } else if (categoryCode === 'GPU') {
        const vramCounts: Record<string, number> = {};
        catProducts.forEach((p) => {
          const v = p.specs.vram_gb;
          if (v) vramCounts[`${v}GB`] = (vramCounts[`${v}GB`] || 0) + 1;
        });
        facets.push({
          code: 'vram_gb',
          label: 'Dung lượng VRAM',
          filter_type: 'CHIP',
          options: Object.entries(vramCounts).map(([k, count]) => ({
            label: k,
            value: k.replace('GB', ''),
            count,
          })),
        });
      } else if (categoryCode === 'MOTHERBOARD') {
        const formCounts: Record<string, number> = {};
        catProducts.forEach((p) => {
          const f = p.specs.form_factor;
          if (f) formCounts[f] = (formCounts[f] || 0) + 1;
        });
        facets.push({
          code: 'form_factor',
          label: 'Kích cỡ (Form Factor)',
          filter_type: 'CHIP',
          options: Object.entries(formCounts).map(([k, count]) => ({
            label: k,
            value: k,
            count,
          })),
        });
      } else if (categoryCode === 'RAM') {
        const memCounts: Record<string, number> = {};
        catProducts.forEach((p) => {
          const m = p.specs.memory_type;
          if (m) memCounts[m] = (memCounts[m] || 0) + 1;
        });
        facets.push({
          code: 'memory_type',
          label: 'Chuẩn RAM',
          filter_type: 'CHIP',
          options: Object.entries(memCounts).map(([k, count]) => ({
            label: k,
            value: k,
            count,
          })),
        });
      }

      // Price options
      facets.push({
        code: 'price_ranges',
        label: 'Khoảng giá',
        filter_type: 'CHIP',
        options: [
          { label: 'Dưới 5 triệu', value: '0-5000000', count: catProducts.filter((p) => p.price < 5000000).length },
          {
            label: '5 - 15 triệu',
            value: '5000000-15000000',
            count: catProducts.filter((p) => p.price >= 5000000 && p.price <= 15000000).length,
          },
          { label: 'Trên 15 triệu', value: '15000000-999999999', count: catProducts.filter((p) => p.price > 15000000).length },
        ],
        min_price: 0,
        max_price: 30000000,
      });

      return {
        success: true,
        status_code: 200,
        message: 'Thành công',
        data: facets,
      };
    }
  },
};
