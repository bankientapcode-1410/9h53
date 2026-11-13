import apiClient from './apiClient';
import {
  ProductFilterCriteria,
  ApiResponse,
  PageResponse,
  ProductSummaryDTO,
  ProductDetailDTO,
  FacetFilterGroupDTO,
  AdminProductDTO,
  buildDynamicPriceOptions,
} from '../features/product-catalog/types/product.types';
import { MOCK_PRODUCTS } from './mockData';

export const productService = {
  /**
   * GET /api/v1/products
   * Duyệt sản phẩm kèm lọc Quick Chips, Whitelist specs, dải giá, phân trang
   */
  async getProducts(criteria: ProductFilterCriteria): Promise<ApiResponse<PageResponse<ProductSummaryDTO>>> {
    try {
      const params: Record<string, string> = {};

      if (criteria.category) params.category = criteria.category;
      if (criteria.brand) {
        const brands = Array.isArray(criteria.brand)
          ? criteria.brand.filter(Boolean).join(',')
          : criteria.brand;
        if (brands) params.brand = brands;
      }
      if (criteria.min_price !== undefined && criteria.min_price > 0) {
        params.min_price = String(criteria.min_price);
      }
      if (
        criteria.max_price !== undefined &&
        criteria.max_price < 999999999 &&
        Number.isFinite(criteria.max_price)
      ) {
        params.max_price = String(criteria.max_price);
      }
      if (criteria.sort && criteria.sort !== 'newest') {
        params.sort = criteria.sort;
      }
      if (criteria.page !== undefined && criteria.page > 0) {
        params.page = String(criteria.page);
      }
      if (criteria.size !== undefined && criteria.size !== 12) {
        params.size = String(criteria.size);
      }
      if (criteria.search && criteria.search.trim()) {
        params.search = criteria.search.trim();
      }

      // Serialize specs[key]
      if (criteria.specs) {
        Object.entries(criteria.specs).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            const strVal = Array.isArray(val) ? val.join(',') : String(val);
            if (strVal) {
              params[`specs[${key}]`] = strVal;
            }
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
        const q = criteria.search.toLowerCase().trim();
        const directMatches = items.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
        if (directMatches.length > 0) {
          items = directMatches;
        } else {
          items = applySemanticIntentFilter(items, q);
        }
      }

      // Sort
      if (criteria.sort === 'price_asc') {
        items.sort((a, b) => a.price - b.price);
      } else if (criteria.sort === 'price_desc') {
        items.sort((a, b) => b.price - a.price);
      } else if (criteria.sort === 'oldest') {
        items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      } else if (!criteria.search) {
        // Chỉ sắp xếp theo mới nhất khi người dùng duyệt bình thường, không tìm kiếm.
        // Khi tìm kiếm (criteria.search), giữ nguyên thứ tự điểm liên quan (relevance ranking) đã tính!
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
      } else if (categoryCode === 'MONITOR') {
        const sizeCounts: Record<string, number> = {};
        const resCounts: Record<string, number> = {};
        const hzCounts: Record<string, number> = {};
        const panelCounts: Record<string, number> = {};
        catProducts.forEach((p) => {
          const sz = p.specs.screen_size_inch;
          if (sz !== undefined && sz !== null) {
            const key = String(sz);
            sizeCounts[key] = (sizeCounts[key] || 0) + 1;
          }
          const r = p.specs.resolution;
          if (r) resCounts[r] = (resCounts[r] || 0) + 1;
          const hz = p.specs.refresh_rate_hz;
          if (hz !== undefined && hz !== null) {
            const key = String(hz);
            hzCounts[key] = (hzCounts[key] || 0) + 1;
          }
          const panel = p.specs.panel_type;
          if (panel) panelCounts[panel] = (panelCounts[panel] || 0) + 1;
        });
        if (Object.keys(sizeCounts).length > 0) {
          facets.push({
            code: 'screen_size_inch',
            label: 'Kích thước màn hình',
            filter_type: 'CHIP',
            options: Object.entries(sizeCounts)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([k, count]) => ({ label: `${k} inch`, value: k, count })),
          });
        }
        if (Object.keys(resCounts).length > 0) {
          facets.push({
            code: 'resolution',
            label: 'Độ phân giải',
            filter_type: 'CHIP',
            options: Object.entries(resCounts).map(([k, count]) => ({ label: k, value: k, count })),
          });
        }
        if (Object.keys(hzCounts).length > 0) {
          facets.push({
            code: 'refresh_rate_hz',
            label: 'Tần số quét',
            filter_type: 'CHIP',
            options: Object.entries(hzCounts)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([k, count]) => ({ label: `${k} Hz`, value: k, count })),
          });
        }
        if (Object.keys(panelCounts).length > 0) {
          facets.push({
            code: 'panel_type',
            label: 'Tấm nền',
            filter_type: 'CHIP',
            options: Object.entries(panelCounts).map(([k, count]) => ({ label: k, value: k, count })),
          });
        }
      } else if (categoryCode === 'KEYBOARD') {
        const layoutCounts: Record<string, number> = {};
        const switchCounts: Record<string, number> = {};
        const ledCounts: Record<string, number> = {};
        catProducts.forEach((p) => {
          const l = p.specs.layout;
          if (l) layoutCounts[l] = (layoutCounts[l] || 0) + 1;
          const sw = p.specs.switch_type;
          if (sw) switchCounts[sw] = (switchCounts[sw] || 0) + 1;
          const led = p.specs.led_type;
          if (led) ledCounts[led] = (ledCounts[led] || 0) + 1;
        });
        if (Object.keys(layoutCounts).length > 0) {
          facets.push({
            code: 'layout',
            label: 'Layout',
            filter_type: 'CHIP',
            options: Object.entries(layoutCounts).map(([k, count]) => ({ label: k, value: k, count })),
          });
        }
        if (Object.keys(switchCounts).length > 0) {
          facets.push({
            code: 'switch_type',
            label: 'Loại Switch',
            filter_type: 'CHIP',
            options: Object.entries(switchCounts).map(([k, count]) => ({ label: k, value: k, count })),
          });
        }
        if (Object.keys(ledCounts).length > 0) {
          facets.push({
            code: 'led_type',
            label: 'Đèn LED',
            filter_type: 'CHIP',
            options: Object.entries(ledCounts).map(([k, count]) => ({ label: k, value: k, count })),
          });
        }
      } else if (categoryCode === 'MOUSE') {
        const dpiCounts: Record<string, number> = {};
        const connCounts: Record<string, number> = {};
        catProducts.forEach((p) => {
          const dpi = p.specs.dpi;
          if (dpi !== undefined && dpi !== null) {
            const key = String(dpi);
            dpiCounts[key] = (dpiCounts[key] || 0) + 1;
          }
          const c = p.specs.connection_type;
          if (c) connCounts[c] = (connCounts[c] || 0) + 1;
        });
        if (Object.keys(dpiCounts).length > 0) {
          facets.push({
            code: 'dpi',
            label: 'Độ nhạy (DPI)',
            filter_type: 'CHIP',
            options: Object.entries(dpiCounts)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([k, count]) => ({ label: `${k} DPI`, value: k, count })),
          });
        }
        if (Object.keys(connCounts).length > 0) {
          facets.push({
            code: 'connection_type',
            label: 'Kết nối',
            filter_type: 'CHIP',
            options: Object.entries(connCounts).map(([k, count]) => ({ label: k, value: k, count })),
          });
        }
      }

      // Price options
      facets.push({
        code: 'price_ranges',
        label: 'Khoảng giá',
        filter_type: 'CHIP',
        options: buildDynamicPriceOptions(catProducts.map((p) => p.price)),
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

  /**
   * Tìm kiếm sản phẩm theo ngữ nghĩa & nhận diện ý định phần cứng (Semantic Search)
   */
  async searchSemantic(query: string, aiRecommendedText?: string): Promise<ApiResponse<PageResponse<ProductSummaryDTO>>> {
    const activeProducts = MOCK_PRODUCTS.filter((p) => p.is_active && !p.deleted_at);
    const filtered = applySemanticIntentFilter(activeProducts, query, aiRecommendedText);

    const summaries: ProductSummaryDTO[] = filtered.slice(0, 8).map((p) => ({
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
      message: 'Tìm kiếm ngữ nghĩa thành công',
      data: {
        content: summaries,
        page: 0,
        size: 8,
        total_elements: summaries.length,
        total_pages: 1,
        first: true,
        last: true,
      },
    };
  },
};

const VIETNAMESE_STOP_WORDS = new Set([
  'máy', 'tính', 'cho', 'của', 'các', 'những', 'cần', 'mua', 'tìm', 'kiếm',
  'loại', 'nào', 'được', 'với', 'trong', 'hàng', 'chính', 'hãng', 'bộ',
  'dàn', 'chiếc', 'cái', 'con', 'em', 'mình', 'tôi', 'bạn', 'giúp', 'pc'
]);

function detectExplicitCategories(query: string): string[] {
  const q = query.toLowerCase();
  const explicit: string[] = [];

  // CPU (Chip, vi xử lý)
  if (/\b(cpu|chip|vi xử lý|bộ vi xử lý|bộ xử lý|processor|intel core|ryzen|core i[3579]|i[3579]-?\d{4,5}[a-z]*)\b/i.test(q)) {
    explicit.push('CPU');
  }
  // GPU (Card màn hình, VGA)
  if (/\b(vga|gpu|card màn hình|card đồ họa|card|rtx|rx|gtx|radeon|geforce)\b/i.test(q) || /chiến lol|fps|esports/.test(q)) {
    explicit.push('GPU');
  }
  // RAM (Bộ nhớ trong)
  if (/\b(ram|thanh ram|bộ nhớ trong|ddr4|ddr5)\b/i.test(q)) {
    explicit.push('RAM');
  }
  // Mainboard (Bo mạch chủ)
  if (/\b(main|mainboard|bo mạch chủ|bo mạch|motherboard|h610|b760|b650|z790|x670)\b/i.test(q)) {
    explicit.push('MOTHERBOARD');
  }
  // SSD (Ổ cứng M.2)
  if (/\b(ssd|ổ cứng|ổ ssd|m2|m\.2|nvme|lưu trữ)\b/i.test(q)) {
    explicit.push('SSD_M2');
  }
  // PSU (Nguồn máy tính)
  if (/\b(nguồn|psu|bộ nguồn|công suất nguồn|80 plus|watt)\b/i.test(q)) {
    explicit.push('PSU');
  }
  // Case (Vỏ máy tính)
  if (/\b(case|vỏ case|vỏ máy tính|thùng máy|thùng case|vỏ pc|bể cá)\b/i.test(q)) {
    explicit.push('CASE');
  }
  // Cooler (Tản nhiệt CPU)
  if (/\b(tản|tản nhiệt|tản khí|tản nước|aio|cooler|cooling|kraken|assassin)\b/i.test(q)) {
    explicit.push('CPU_COOLER');
  }

  return explicit;
}

function applySemanticIntentFilter(
  products: AdminProductDTO[],
  query: string,
  aiRecommendedText?: string
): AdminProductDTO[] {
  const qLower = query.toLowerCase().trim();
  const aiLower = (aiRecommendedText || '').toLowerCase();
  const explicitCats = detectExplicitCategories(query);

  let candidates = products;
  // Nếu câu tìm kiếm nêu rõ linh kiện cụ thể (VD: "Chip cho máy tính văn phòng" -> CPU, "Card chiến LOL" -> GPU, "RAM 16GB" -> RAM),
  // CÔ LẬP TRIỆT ĐỂ danh mục đó, TUYỆT ĐỐI không để lọt Vỏ Case, Nguồn hay linh kiện khác vào kết quả!
  if (explicitCats.length > 0) {
    candidates = candidates.filter((p) => explicitCats.includes(p.category.category_code));
  }

  // Model & Brand tokens
  const tokenRegex = /(12100|12400|13600|7600|7800|6600|3060|4060|4070|h610|b760|b650|nv2|kc3000|990|550bn|cv650|rm750|rm850|nyx|air\s*100|h5|o11|assassin|ak620|aqua|lt720|kraken|asus|msi|intel|amd|corsair|kingston|deepcool|nzxt|thermalright|montech|lian\s*li|xigmatek|samsung)/gi;
  const queryTokens = (qLower.match(tokenRegex) || []).map((t) => t.toLowerCase());
  const aiTokens = (aiLower.match(tokenRegex) || []).map((t) => t.toLowerCase());
  const allTokens = Array.from(new Set([...queryTokens, ...aiTokens]));

  // Lọc từ khóa có nghĩa, loại bỏ hư từ tiếng Việt như 'máy', 'tính', 'cho', 'của' để tránh match tràn lan
  const queryWords = qLower
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((w) => w.length > 1 && !VIETNAMESE_STOP_WORDS.has(w));

  const isOffice = /văn phòng|office|học tập|word|excel/.test(qLower);
  const isBudget = /giá rẻ|sinh viên|rẻ|bình dân|tiết kiệm/.test(qLower);

  const scored = candidates.map((p) => {
    let score = 10; // Điểm cơ bản cho sản phẩm thuộc đúng danh mục yêu cầu
    const pNameLower = p.name.toLowerCase();
    const pBrandLower = p.brand.toLowerCase();
    const pDescLower = (p.description || '').toLowerCase();

    // AI mention boost
    if (aiLower && (aiLower.includes(pNameLower) || aiLower.includes(p.name.toLowerCase()))) {
      score += 100;
    }

    // Specific tokens match (4060, 12100, asus, intel,...)
    allTokens.forEach((token) => {
      if (pNameLower.includes(token)) score += 30;
      if (pBrandLower.includes(token)) score += 15;
    });

    // Individual content words match
    queryWords.forEach((w) => {
      if (pNameLower.includes(w)) score += 15;
      if (pDescLower.includes(w)) score += 10;
    });

    // Office & Budget boosts: ưu tiên các mẫu chip/linh kiện giá mềm, tối ưu chi phí văn phòng
    if (isOffice || isBudget) {
      if (p.price <= 3500000) score += 40;
      else if (p.price <= 6000000) score += 20;
    }

    return { product: p, score };
  });

  const matched = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  if (matched.length > 0) {
    return matched.map((item) => item.product);
  }

  return candidates;
}
