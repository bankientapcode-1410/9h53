import apiClient from './apiClient';
import {
  CompatRule,
  CreateCompatRuleRequest,
  UpdateCompatRuleRequest,
  RuleFilterCriteria,
  RuleSchemaMetadata,
  DryRunRuleRequest,
  DryRunResult,
} from '../features/admin/rules/types/rule.types';
import { ApiResponse, PageResponse } from '../features/product-catalog/types/product.types';
import { MOCK_PRODUCTS } from './mockData';

// Initial mock rules for frontend standalone dev & demo fallback
let inMemoryRules: CompatRule[] = [
  {
    rule_id: 'r0000001-0000-0000-0000-000000000001',
    rule_name: 'CPU-Motherboard Socket Match',
    source_category: 'CPU',
    target_category: 'MOTHERBOARD',
    source_spec_key: 'socket_type',
    target_spec_key: 'supported_sockets',
    operator: 'IN',
    severity: 'ERROR',
    error_message_template: 'CPU socket {source_value} không tương thích với Mainboard (hỗ trợ: {target_value}). Vui lòng chọn Mainboard có socket phù hợp.',
    is_active: true,
    priority: 1,
    created_at: '2026-10-24T10:00:00',
    updated_at: '2026-10-24T10:00:00',
  },
  {
    rule_id: 'r0000001-0000-0000-0000-000000000002',
    rule_name: 'RAM Type Compatibility',
    source_category: 'RAM',
    target_category: 'MOTHERBOARD',
    source_spec_key: 'memory_type',
    target_spec_key: 'supported_memory_types',
    operator: 'IN',
    severity: 'ERROR',
    error_message_template: 'Chuẩn RAM {source_value} không lắp vừa khe cắm của Mainboard (hỗ trợ: {target_value}).',
    is_active: true,
    priority: 2,
    created_at: '2026-10-24T10:00:00',
    updated_at: '2026-10-24T10:00:00',
  },
  {
    rule_id: 'r0000001-0000-0000-0000-000000000003',
    rule_name: 'RAM Slot Count',
    source_category: 'RAM',
    target_category: 'MOTHERBOARD',
    source_spec_key: '_count',
    target_spec_key: 'ram_slots',
    operator: 'LTE',
    severity: 'ERROR',
    error_message_template: 'Số lượng thanh RAM ({source_value}) vượt quá số khe cắm khả dụng trên Mainboard ({target_value} khe).',
    is_active: true,
    priority: 3,
    created_at: '2026-10-24T10:00:00',
    updated_at: '2026-10-24T10:00:00',
  },
  {
    rule_id: 'r0000001-0000-0000-0000-000000000004',
    rule_name: 'Max RAM Capacity',
    source_category: 'RAM',
    target_category: 'MOTHERBOARD',
    source_spec_key: '_sum_capacity_gb',
    target_spec_key: 'max_ram_gb',
    operator: 'LTE',
    severity: 'ERROR',
    error_message_template: 'Tổng dung lượng RAM ({source_value} GB) vượt quá giới hạn tối đa mà Mainboard hỗ trợ ({target_value} GB).',
    is_active: true,
    priority: 4,
    created_at: '2026-10-24T10:00:00',
    updated_at: '2026-10-24T10:00:00',
  },
  {
    rule_id: 'r0000001-0000-0000-0000-000000000005',
    rule_name: 'GPU Length vs Case',
    source_category: 'GPU',
    target_category: 'CASE',
    source_spec_key: 'length_mm',
    target_spec_key: 'max_gpu_length_mm',
    operator: 'LTE',
    severity: 'ERROR',
    error_message_template: 'Chiều dài Card đồ họa ({source_value} mm) vượt quá kích thước khoang lắp GPU của Vỏ Case ({target_value} mm).',
    is_active: true,
    priority: 5,
    created_at: '2026-10-24T10:00:00',
    updated_at: '2026-10-24T10:00:00',
  },
  {
    rule_id: 'r0000001-0000-0000-0000-000000000006',
    rule_name: 'CPU Cooler Socket Support',
    source_category: 'CPU',
    target_category: 'CPU_COOLER',
    source_spec_key: 'socket_type',
    target_spec_key: 'supported_sockets',
    operator: 'IN',
    severity: 'ERROR',
    error_message_template: 'Tản nhiệt không hỗ trợ ngàm socket {source_value} của CPU (hỗ trợ: {target_value}).',
    is_active: true,
    priority: 6,
    created_at: '2026-10-24T10:00:00',
    updated_at: '2026-10-24T10:00:00',
  },
  {
    rule_id: 'r0000001-0000-0000-0000-000000000007',
    rule_name: 'PSU Wattage Sufficiency',
    source_category: '_SYSTEM',
    target_category: 'PSU',
    source_spec_key: '_total_tdp_w',
    target_spec_key: 'rated_wattage_w',
    operator: 'LTE',
    severity: 'WARNING',
    error_message_template: 'Tổng công suất tiêu thụ ước tính của hệ thống ({source_value}W) vượt công suất định mức của bộ nguồn ({target_value}W). Khuyến nghị nâng cấp nguồn.',
    is_active: true,
    priority: 7,
    created_at: '2026-10-24T10:00:00',
    updated_at: '2026-10-24T10:00:00',
  },
  {
    rule_id: 'r0000001-0000-0000-0000-000000000008',
    rule_name: 'Mainboard Form Factor vs Case',
    source_category: 'MOTHERBOARD',
    target_category: 'CASE',
    source_spec_key: 'form_factor',
    target_spec_key: 'supported_form_factors',
    operator: 'IN',
    severity: 'ERROR',
    error_message_template: 'Kích cỡ bo mạch chủ {source_value} không vừa kích thước thùng case hỗ trợ ({target_value}).',
    is_active: true,
    priority: 8,
    created_at: '2026-10-24T10:00:00',
    updated_at: '2026-10-24T10:00:00',
  },
];

export const FALLBACK_RULE_METADATA: RuleSchemaMetadata = {
  categories: [
    { category_code: 'CPU', category_name: 'Bộ vi xử lý (CPU)' },
    { category_code: 'MOTHERBOARD', category_name: 'Bo mạch chủ (Mainboard)' },
    { category_code: 'RAM', category_name: 'Bộ nhớ trong (RAM)' },
    { category_code: 'GPU', category_name: 'Card màn hình (VGA)' },
    { category_code: 'SSD_M2', category_name: 'Ổ cứng SSD M.2 NVMe' },
    { category_code: 'PSU', category_name: 'Nguồn máy tính (PSU)' },
    { category_code: 'CASE', category_name: 'Vỏ máy tính (Case)' },
    { category_code: 'CPU_COOLER', category_name: 'Tản nhiệt CPU' },
    { category_code: '_SYSTEM', category_name: 'Toàn hệ thống (_SYSTEM)' },
  ],
  spec_keys_by_category: {
    CPU: [
      { key: 'socket_type', label: 'Socket', type: 'STRING', required: true },
      { key: 'tdp_w', label: 'Công suất tiêu thụ (TDP)', type: 'NUMBER', required: true },
      { key: 'supported_ram_type', label: 'Chuẩn RAM hỗ trợ', type: 'ARRAY_STRING', required: false },
    ],
    MOTHERBOARD: [
      { key: 'socket_type', label: 'Socket', type: 'STRING', required: true },
      { key: 'supported_sockets', label: 'Socket hỗ trợ', type: 'ARRAY_STRING', required: true },
      { key: 'form_factor', label: 'Kích cỡ bo mạch', type: 'STRING', required: true },
      { key: 'supported_memory_types', label: 'Chuẩn RAM hỗ trợ', type: 'ARRAY_STRING', required: true },
      { key: 'ram_slots', label: 'Số khe cắm RAM', type: 'INTEGER', required: true },
      { key: 'max_ram_gb', label: 'Dung lượng RAM tối đa (GB)', type: 'NUMBER', required: true },
    ],
    RAM: [
      { key: 'memory_type', label: 'Chuẩn RAM (DDR4/DDR5)', type: 'STRING', required: true },
      { key: 'capacity_gb', label: 'Tổng dung lượng (GB)', type: 'NUMBER', required: true },
      { key: 'modules_per_kit', label: 'Số thanh trong kit', type: 'INTEGER', required: false },
    ],
    GPU: [
      { key: 'length_mm', label: 'Chiều dài (mm)', type: 'NUMBER', required: true },
      { key: 'tdp_w', label: 'Công suất tiêu thụ (TDP)', type: 'NUMBER', required: true },
      { key: 'recommended_psu_w', label: 'Công suất nguồn khuyến nghị (W)', type: 'NUMBER', required: false },
    ],
    SSD_M2: [
      { key: 'form_factor', label: 'Kích thước M.2 (2280...)', type: 'STRING', required: true },
      { key: 'pcie_gen', label: 'Phiên bản PCIe', type: 'NUMBER', required: false },
    ],
    PSU: [
      { key: 'rated_wattage_w', label: 'Công suất định mức (W)', type: 'NUMBER', required: true },
      { key: 'efficiency_rating', label: 'Chuẩn hiệu suất', type: 'STRING', required: false },
    ],
    CASE: [
      { key: 'max_gpu_length_mm', label: 'Chiều dài GPU tối đa (mm)', type: 'NUMBER', required: true },
      { key: 'max_cooler_height_mm', label: 'Chiều cao tản nhiệt tối đa (mm)', type: 'NUMBER', required: true },
      { key: 'supported_form_factors', label: 'Kích thước bo mạch hỗ trợ', type: 'ARRAY_STRING', required: true },
    ],
    CPU_COOLER: [
      { key: 'height_mm', label: 'Chiều cao tản nhiệt (mm)', type: 'NUMBER', required: true },
      { key: 'supported_sockets', label: 'Socket hỗ trợ', type: 'ARRAY_STRING', required: true },
      { key: 'tdp_w', label: 'Công suất tản nhiệt tối đa (W)', type: 'NUMBER', required: true },
    ],
    _SYSTEM: [
      { key: '_total_tdp_w', label: 'Tổng TDP toàn hệ thống (W)', type: 'NUMBER', required: true },
    ],
  },
  builtin_aggregate_keys: [
    { key: '_count', label: 'Số lượng khe vật lý chiếm dụng (_count)', supported_operators: ['LTE', 'GTE', 'EQUALS', 'RANGE'] },
    { key: '_sum_capacity_gb', label: 'Tổng dung lượng bộ nhớ GB (_sum_capacity_gb)', supported_operators: ['LTE', 'GTE', 'EQUALS', 'RANGE'] },
    { key: '_total_tdp_w', label: 'Tổng công suất tiêu thụ hệ thống W (_total_tdp_w)', supported_operators: ['LTE', 'GTE', 'EQUALS', 'RANGE'] },
  ],
  operators: ['EQUALS', 'IN', 'NOT_IN', 'LTE', 'GTE', 'RANGE'],
  severities: ['ERROR', 'WARNING', 'INFO'],
  allowed_placeholders: [
    '{source_name}',
    '{target_name}',
    '{source_value}',
    '{target_value}',
    '{source_category}',
    '{target_category}',
  ],
};

export const ruleAdminService = {
  async getRules(criteria: RuleFilterCriteria): Promise<ApiResponse<PageResponse<CompatRule>>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<CompatRule>>>('/api/v1/admin/rules', {
        params: criteria,
      });
      return response.data;
    } catch (error) {
      console.warn('[ruleAdminService.getRules] API call failed, using mock rules fallback:', error);
      let filtered = [...inMemoryRules];

      if (criteria.source_category) {
        filtered = filtered.filter(r => r.source_category.toUpperCase() === criteria.source_category?.toUpperCase());
      }
      if (criteria.target_category) {
        filtered = filtered.filter(r => r.target_category.toUpperCase() === criteria.target_category?.toUpperCase());
      }
      if (criteria.severity) {
        filtered = filtered.filter(r => r.severity === criteria.severity);
      }
      if (criteria.is_active !== undefined) {
        filtered = filtered.filter(r => r.is_active === criteria.is_active);
      }
      if (criteria.keyword) {
        const kw = criteria.keyword.toLowerCase();
        filtered = filtered.filter(r =>
          r.rule_name.toLowerCase().includes(kw) ||
          r.source_spec_key.toLowerCase().includes(kw) ||
          r.target_spec_key.toLowerCase().includes(kw) ||
          r.error_message_template.toLowerCase().includes(kw)
        );
      }

      filtered.sort((a, b) => a.priority - b.priority);

      const page = criteria.page || 0;
      const size = criteria.size || 20;
      const start = page * size;
      const paginated = filtered.slice(start, start + size);

      return {
        success: true,
        status_code: 200,
        message: 'Thành công (Mock)',
        data: {
          content: paginated,
          page: page,
          size: size,
          total_elements: filtered.length,
          total_pages: Math.ceil(filtered.length / size),
          first: page === 0,
          last: start + size >= filtered.length,
        },
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getMetadataSchema(): Promise<ApiResponse<RuleSchemaMetadata>> {
    try {
      const response = await apiClient.get<ApiResponse<RuleSchemaMetadata>>('/api/v1/admin/rules/metadata');
      return response.data;
    } catch (error) {
      console.warn('[ruleAdminService.getMetadataSchema] API call failed, using mock metadata:', error);
      return {
        success: true,
        status_code: 200,
        message: 'Thành công (Mock)',
        data: FALLBACK_RULE_METADATA,
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getRuleById(ruleId: string): Promise<ApiResponse<CompatRule>> {
    try {
      const response = await apiClient.get<ApiResponse<CompatRule>>(`/api/v1/admin/rules/${ruleId}`);
      return response.data;
    } catch (error) {
      const found = inMemoryRules.find(r => r.rule_id === ruleId);
      if (!found) throw new Error('Không tìm thấy quy tắc tương thích');
      return {
        success: true,
        status_code: 200,
        message: 'Thành công (Mock)',
        data: found,
        timestamp: new Date().toISOString(),
      };
    }
  },

  async createRule(request: CreateCompatRuleRequest): Promise<ApiResponse<CompatRule>> {
    try {
      const response = await apiClient.post<ApiResponse<CompatRule>>('/api/v1/admin/rules', request);
      return response.data;
    } catch (error) {
      console.warn('[ruleAdminService.createRule] API call failed, saving to mock storage:', error);
      const newRule: CompatRule = {
        rule_id: 'r-mock-' + Date.now(),
        rule_name: request.rule_name,
        source_category: request.source_category.toUpperCase(),
        target_category: request.target_category.toUpperCase(),
        source_spec_key: request.source_spec_key.toLowerCase(),
        target_spec_key: request.target_spec_key.toLowerCase(),
        operator: request.operator,
        severity: request.severity,
        error_message_template: request.error_message_template,
        is_active: request.is_active ?? true,
        priority: request.priority ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      inMemoryRules.unshift(newRule);
      return {
        success: true,
        status_code: 201,
        message: 'Tạo quy tắc thành công (Mock)',
        data: newRule,
        timestamp: new Date().toISOString(),
      };
    }
  },

  async updateRule(ruleId: string, request: UpdateCompatRuleRequest): Promise<ApiResponse<CompatRule>> {
    try {
      const response = await apiClient.put<ApiResponse<CompatRule>>(`/api/v1/admin/rules/${ruleId}`, request);
      return response.data;
    } catch (error) {
      const idx = inMemoryRules.findIndex(r => r.rule_id === ruleId);
      if (idx === -1) throw new Error('Không tìm thấy quy tắc');
      const updated: CompatRule = {
        ...inMemoryRules[idx],
        rule_name: request.rule_name,
        source_category: request.source_category.toUpperCase(),
        target_category: request.target_category.toUpperCase(),
        source_spec_key: request.source_spec_key.toLowerCase(),
        target_spec_key: request.target_spec_key.toLowerCase(),
        operator: request.operator,
        severity: request.severity,
        error_message_template: request.error_message_template,
        is_active: request.is_active ?? inMemoryRules[idx].is_active,
        priority: request.priority ?? inMemoryRules[idx].priority,
        updated_at: new Date().toISOString(),
      };
      inMemoryRules[idx] = updated;
      return {
        success: true,
        status_code: 200,
        message: 'Cập nhật thành công (Mock)',
        data: updated,
        timestamp: new Date().toISOString(),
      };
    }
  },

  async updateRuleStatus(ruleId: string, isActive: boolean): Promise<ApiResponse<CompatRule>> {
    try {
      const response = await apiClient.patch<ApiResponse<CompatRule>>(`/api/v1/admin/rules/${ruleId}/status`, {
        is_active: isActive,
      });
      return response.data;
    } catch (error) {
      const idx = inMemoryRules.findIndex(r => r.rule_id === ruleId);
      if (idx !== -1) {
        inMemoryRules[idx].is_active = isActive;
        inMemoryRules[idx].updated_at = new Date().toISOString();
        return {
          success: true,
          status_code: 200,
          message: 'Cập nhật trạng thái thành công (Mock)',
          data: inMemoryRules[idx],
          timestamp: new Date().toISOString(),
        };
      }
      throw error;
    }
  },

  async deleteRule(ruleId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/admin/rules/${ruleId}`);
    } catch (error) {
      inMemoryRules = inMemoryRules.filter(r => r.rule_id !== ruleId);
    }
  },

  async dryRun(request: DryRunRuleRequest): Promise<ApiResponse<DryRunResult>> {
    try {
      const response = await apiClient.post<ApiResponse<DryRunResult>>('/api/v1/admin/rules/dry-run', request);
      return response.data;
    } catch (error) {
      console.warn('[ruleAdminService.dryRun] API call failed, generating realistic mock dry-run result:', error);
      const rule = request.rule_definition;
      const testItems = request.test_items || [];
      const srcKey = (rule.source_spec_key || '').trim().toLowerCase();
      const tgtKey = (rule.target_spec_key || '').trim().toLowerCase();
      const srcCat = (rule.source_category || '').trim().toUpperCase();
      const tgtCat = (rule.target_category || '').trim().toUpperCase();

      let extractedSource: any = null;
      let extractedTarget: any = null;
      let firstSrcProd: any = null;
      let firstTgtProd: any = null;

      // Extract source value
      if (srcKey === '_total_tdp_w') {
        extractedSource = testItems.reduce((sum, item) => {
          const p = MOCK_PRODUCTS.find((prod) => prod.product_id === item.product_id);
          return sum + Number(p?.specs?.tdp_w || 0) * (item.quantity || 1);
        }, 0);
      } else if (srcKey === '_count') {
        extractedSource = testItems
          .filter((item) => {
            const p = MOCK_PRODUCTS.find((prod) => prod.product_id === item.product_id);
            return p?.category?.category_code?.toUpperCase() === srcCat;
          })
          .reduce((sum, item) => sum + (item.quantity || 1), 0);
      } else if (srcKey === '_sum_capacity_gb') {
        extractedSource = testItems.reduce((sum, item) => {
          const p = MOCK_PRODUCTS.find((prod) => prod.product_id === item.product_id);
          return sum + Number(p?.specs?.capacity_gb || 0) * (item.quantity || 1);
        }, 0);
      } else {
        const srcItem = testItems.find((item) => {
          const p = MOCK_PRODUCTS.find((prod) => prod.product_id === item.product_id);
          return p?.category?.category_code?.toUpperCase() === srcCat;
        });
        if (srcItem) {
          firstSrcProd = MOCK_PRODUCTS.find((prod) => prod.product_id === srcItem.product_id);
          extractedSource = firstSrcProd?.specs?.[srcKey] ?? null;
        }
      }

      // Extract target value
      const tgtItem = testItems.find((item) => {
        const p = MOCK_PRODUCTS.find((prod) => prod.product_id === item.product_id);
        return p?.category?.category_code?.toUpperCase() === tgtCat;
      });
      if (tgtItem) {
        firstTgtProd = MOCK_PRODUCTS.find((prod) => prod.product_id === tgtItem.product_id);
        extractedTarget = firstTgtProd?.specs?.[tgtKey] ?? null;
      }

      // Evaluate operator
      let isPass = false;
      if (extractedSource !== null && extractedTarget !== null && extractedSource !== undefined && extractedTarget !== undefined) {
        const norm = (v: any) => String(v).trim().toLowerCase();
        switch (rule.operator) {
          case 'IN': {
            const arr = Array.isArray(extractedTarget) ? extractedTarget : [extractedTarget];
            isPass = arr.some((i: any) => norm(i) === norm(extractedSource));
            break;
          }
          case 'NOT_IN': {
            const arr = Array.isArray(extractedTarget) ? extractedTarget : [extractedTarget];
            isPass = !arr.some((i: any) => norm(i) === norm(extractedSource));
            break;
          }
          case 'EQUALS': {
            isPass = norm(extractedSource) === norm(extractedTarget);
            break;
          }
          case 'LTE': {
            isPass = Number(extractedSource) <= Number(extractedTarget);
            break;
          }
          case 'GTE': {
            isPass = Number(extractedSource) >= Number(extractedTarget);
            break;
          }
          case 'RANGE': {
            if (Array.isArray(extractedTarget) && extractedTarget.length >= 2) {
              isPass = Number(extractedSource) >= Number(extractedTarget[0]) && Number(extractedSource) <= Number(extractedTarget[1]);
            }
            break;
          }
          default:
            isPass = false;
        }
      }

      let renderedMsg: string | null = null;
      if (!isPass) {
        renderedMsg = rule.error_message_template
          .replace('{source_name}', firstSrcProd?.name || srcCat)
          .replace('{source_value}', String(extractedSource))
          .replace('{target_name}', firstTgtProd?.name || tgtCat)
          .replace('{target_value}', Array.isArray(extractedTarget) ? extractedTarget.join(', ') : String(extractedTarget))
          .replace('{source_category}', srcCat)
          .replace('{target_category}', tgtCat);
      }

      return {
        success: true,
        status_code: 200,
        message: 'Chạy thử hoàn tất (Mock)',
        data: {
          is_compatible: isPass,
          extracted_source_value: extractedSource,
          extracted_target_value: extractedTarget,
          rendered_violation_message: renderedMsg,
          violations: isPass
            ? []
            : [
                {
                  rule_id: 'dryrun-mock',
                  rule_name: rule.rule_name,
                  severity: rule.severity,
                  message: renderedMsg || 'Không thỏa mãn điều kiện quy tắc tương thích',
                  source_product: firstSrcProd ? { id: firstSrcProd.product_id, name: firstSrcProd.name, category_code: firstSrcProd.category?.category_code || '' } : null,
                  target_product: firstTgtProd ? { id: firstTgtProd.product_id, name: firstTgtProd.name, category_code: firstTgtProd.category?.category_code || '' } : null,
                },
              ],
          missing_spec_warnings: [],
          execution_time_ms: 0.38,
        },
        timestamp: new Date().toISOString(),
      };
    }
  },
};
