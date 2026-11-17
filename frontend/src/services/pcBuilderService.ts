import axios from 'axios';
import apiClient from './apiClient';
import { MOCK_PRODUCTS } from './mockData';
import type {
  AdminProductDTO,
  ApiResponse,
  PageResponse,
  ProductSummaryDTO,
} from '@/features/product-catalog/types/product.types';
import type {
  AddBuildToCartRequest,
  AddBuildToCartResponseDTO,
  BuildItemInput,
  BuilderGateStatus,
  BuilderSlotCode,
  BuildTelemetryDTO,
  CandidateProductDTO,
  CompatibilityResult,
  CompatibilityViolation,
  PCBuilderEvaluateRequest,
  PCBuilderEvaluateResponse,
  QuickFixOptionDTO,
  QuickFixRequest,
  QuickFixResponse,
  QuickFixStrategyGroupDTO,
  ResolveBuildRequest,
  ResolveBuildResponseDTO,
  ResolvedSlotItemDTO,
  SlotCandidateSearchRequest,
  SlotDiagnosticDTO,
  SlotStatusLevel,
  StockIssueDTO,
  ValidatedCartItemDTO,
} from '@/features/pc-builder/types/builder.types';

const CORE_SLOTS: BuilderSlotCode[] = [
  'CPU',
  'MOTHERBOARD',
  'RAM',
  'GPU',
  'SSD_M2',
  'PSU',
  'CASE',
  'CPU_COOLER',
];

const RECOMMENDED_SLOTS: BuilderSlotCode[] = [
  'CPU',
  'MOTHERBOARD',
  'RAM',
  'SSD_M2',
  'PSU',
  'CASE',
];

const EXCLUDED_TDP_CATEGORIES = new Set(['PSU', 'CPU_COOLER']);
const BASE_SYSTEM_OVERHEAD_W = 50;
const SLOT_PRIORITY: Record<SlotStatusLevel, number> = {
  EMPTY: 0,
  COMPATIBLE: 1,
  INFO: 2,
  WARNING: 3,
  ERROR: 4,
};

const toNum = (val: unknown, fallback = 0): number => {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = Number(val.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toStr = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

const toStrArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val.map((v) => String(v).trim().toUpperCase()).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    return val
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }
  return [];
};

const roundDecimals = (val: number, decimals: number): number => {
  const scale = Math.pow(10, decimals);
  return Math.round(val * scale) / scale;
};

const classifyBalanceLabel = (index: number): string => {
  if (index >= 80) return 'CÂN BẰNG TỐT';
  if (index >= 60) return 'KHÁ TỐT';
  return 'CÓ ĐIỂM NGHẼN';
};

const toProductRef = (product: AdminProductDTO) => ({
  id: product.product_id,
  name: product.name,
  category_code: product.category.category_code.trim().toUpperCase(),
});

/**
 * Đánh giá cấu hình offline dựa trên MOCK_PRODUCTS & 10 luật chuẩn (V2__seed_rules.sql)
 * dùng khi Backend chưa chạy ở môi trường Local Dev.
 */
export function evaluateBuildOffline(items: BuildItemInput[]): PCBuilderEvaluateResponse {
  const startMs = performance.now();

  const mergedQty = new Map<string, number>();
  for (const item of items || []) {
    if (!item?.product_id?.trim()) continue;
    const id = item.product_id.trim();
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    mergedQty.set(id, (mergedQty.get(id) ?? 0) + qty);
  }

  const slotStatuses: Record<string, SlotDiagnosticDTO> = {};
  for (const slot of CORE_SLOTS) {
    slotStatuses[slot] = {
      status: 'EMPTY',
      error_count: 0,
      warning_count: 0,
      info_count: 0,
      violation_rule_ids: [],
    };
  }

  if (mergedQty.size === 0) {
    return {
      compatibility: {
        is_compatible: true,
        errors: [],
        warnings: [],
        info: [],
        unresolved_product_ids: [],
      },
      telemetry: {
        total_price: 0,
        estimated_tdp_w: 0,
        recommended_psu_w: 0,
        selected_psu_wattage_w: null,
        psu_load_percent: null,
        balance_index: null,
        balance_label: 'CHƯA ĐỦ DỮ LIỆU',
        selected_core_slots: 0,
        total_core_slots: CORE_SLOTS.length,
        evaluation_time_ms: roundDecimals(performance.now() - startMs, 2),
      },
      slot_statuses: slotStatuses,
      gate_status: 'BLOCKED_EMPTY',
      stock_issues: [],
      missing_recommended_slots: [...RECOMMENDED_SLOTS],
      is_offline_mock: true,
    };
  }

  const mockById = new Map<string, AdminProductDTO>();
  for (const p of MOCK_PRODUCTS) {
    if (p.is_active && !p.deleted_at) {
      mockById.set(p.product_id, p);
    }
  }

  const foundProducts: Array<{ product: AdminProductDTO; qty: number; cat: string }> = [];
  const unresolvedIds: string[] = [];

  mergedQty.forEach((qty, id) => {
    const product = mockById.get(id);
    if (!product) {
      unresolvedIds.push(id);
    } else {
      foundProducts.push({
        product,
        qty,
        cat: product.category.category_code.trim().toUpperCase(),
      });
    }
  });

  const byCat = new Map<string, Array<{ product: AdminProductDTO; qty: number }>>();
  const stockIssues: StockIssueDTO[] = [];
  let totalPrice = 0;
  let componentTdpW = 0;

  for (const entry of foundProducts) {
    const { product, qty, cat } = entry;
    totalPrice += product.price * qty;

    if (product.stock_quantity < qty) {
      stockIssues.push({
        product_id: product.product_id,
        name: product.name,
        slot_code: cat,
        requested_quantity: qty,
        available_stock: product.stock_quantity,
        reason:
          product.stock_quantity === 0
            ? 'Sản phẩm đã hết hàng'
            : `Tồn kho không đủ (còn ${product.stock_quantity}, yêu cầu ${qty})`,
      });
    }

    if (!EXCLUDED_TDP_CATEGORIES.has(cat)) {
      componentTdpW += qty * toNum(product.specs?.tdp_w, 0);
    }

    const list = byCat.get(cat) ?? [];
    list.push({ product, qty });
    byCat.set(cat, list);
  }

  let selectedCoreSlots = 0;
  for (const slot of CORE_SLOTS) {
    if ((byCat.get(slot)?.length ?? 0) > 0) {
      selectedCoreSlots += 1;
      slotStatuses[slot].status = 'COMPATIBLE';
    }
  }

  const estimatedTdpW = selectedCoreSlots > 0 ? roundDecimals(componentTdpW + BASE_SYSTEM_OVERHEAD_W, 1) : 0;

  const cpus = byCat.get('CPU') ?? [];
  const motherboards = byCat.get('MOTHERBOARD') ?? [];
  const rams = byCat.get('RAM') ?? [];
  const gpus = byCat.get('GPU') ?? [];
  const ssds = byCat.get('SSD_M2') ?? [];
  const psus = byCat.get('PSU') ?? [];
  const cases = byCat.get('CASE') ?? [];
  const coolers = byCat.get('CPU_COOLER') ?? [];

  const errors: CompatibilityViolation[] = [];
  const warnings: CompatibilityViolation[] = [];
  const info: CompatibilityViolation[] = [];

  // Rule 1: CPU -> MOTHERBOARD socket_type IN supported_sockets (ERROR)
  for (const { product: cpu } of cpus) {
    const cpuSocket = toStr(cpu.specs?.socket_type).toUpperCase();
    for (const { product: mb } of motherboards) {
      const supported = toStrArray(mb.specs?.supported_sockets);
      if (cpuSocket && supported.length > 0 && !supported.includes(cpuSocket)) {
        errors.push({
          rule_id: 'r0000001-0000-0000-0000-000000000001',
          rule_name: 'CPU-Motherboard Socket Match',
          severity: 'ERROR',
          message: `CPU socket ${cpuSocket} không tương thích với Mainboard (hỗ trợ: ${supported.join(', ')}).`,
          source_product: toProductRef(cpu),
          target_product: toProductRef(mb),
        });
      }
    }
  }

  // Rule 2: RAM -> MOTHERBOARD memory_type IN supported_memory_types (ERROR)
  for (const { product: ram } of rams) {
    const memType = toStr(ram.specs?.memory_type).toUpperCase();
    for (const { product: mb } of motherboards) {
      const supported = toStrArray(mb.specs?.supported_memory_types);
      if (memType && supported.length > 0 && !supported.includes(memType)) {
        errors.push({
          rule_id: 'r0000001-0000-0000-0000-000000000002',
          rule_name: 'RAM Type Compatibility',
          severity: 'ERROR',
          message: `Chuẩn RAM ${memType} không lắp vừa khe cắm của Mainboard (hỗ trợ: ${supported.join(', ')}).`,
          source_product: toProductRef(ram),
          target_product: toProductRef(mb),
        });
      }
    }
  }

  // Rule 3 & 4: RAM aggregate _count <= ram_slots & _sum_capacity_gb <= max_ram_gb (ERROR)
  if (rams.length > 0 && motherboards.length > 0) {
    const totalRamModules = rams.reduce(
      (sum, { product, qty }) => sum + qty * Math.max(1, toNum(product.specs?.modules_per_kit, 1)),
      0
    );
    const totalRamGb = rams.reduce(
      (sum, { product, qty }) => sum + qty * toNum(product.specs?.capacity_gb, 0),
      0
    );
    const repRam = rams[0].product;
    for (const { product: mb } of motherboards) {
      const ramSlots = toNum(mb.specs?.ram_slots, 0);
      if (ramSlots > 0 && totalRamModules > ramSlots) {
        errors.push({
          rule_id: 'r0000001-0000-0000-0000-000000000003',
          rule_name: 'RAM Slot Count',
          severity: 'ERROR',
          message: `Số lượng thanh RAM (${totalRamModules}) vượt quá số khe cắm khả dụng trên Mainboard (${ramSlots} khe).`,
          source_product: toProductRef(repRam),
          target_product: toProductRef(mb),
        });
      }
      const maxRamGb = toNum(mb.specs?.max_ram_gb, 0);
      if (maxRamGb > 0 && totalRamGb > maxRamGb) {
        errors.push({
          rule_id: 'r0000001-0000-0000-0000-000000000004',
          rule_name: 'Max RAM Capacity',
          severity: 'ERROR',
          message: `Tổng dung lượng RAM (${totalRamGb} GB) vượt quá giới hạn tối đa mà Mainboard hỗ trợ (${maxRamGb} GB).`,
          source_product: toProductRef(repRam),
          target_product: toProductRef(mb),
        });
      }
    }
  }

  // Rule 5: GPU -> CASE length_mm <= max_gpu_length_mm (ERROR)
  for (const { product: gpu } of gpus) {
    const gpuLen = toNum(gpu.specs?.length_mm, 0);
    for (const { product: pcCase } of cases) {
      const maxLen = toNum(pcCase.specs?.max_gpu_length_mm, 0);
      if (gpuLen > 0 && maxLen > 0 && gpuLen > maxLen) {
        errors.push({
          rule_id: 'r0000001-0000-0000-0000-000000000005',
          rule_name: 'GPU Length vs Case',
          severity: 'ERROR',
          message: `Chiều dài Card đồ họa (${gpuLen} mm) vượt quá kích thước khoang lắp GPU của Vỏ Case (${maxLen} mm).`,
          source_product: toProductRef(gpu),
          target_product: toProductRef(pcCase),
        });
      }
    }
  }

  // Rule 6: CPU -> CPU_COOLER socket_type IN supported_sockets (ERROR)
  for (const { product: cpu } of cpus) {
    const cpuSocket = toStr(cpu.specs?.socket_type).toUpperCase();
    for (const { product: cooler } of coolers) {
      const supported = toStrArray(cooler.specs?.supported_sockets);
      if (cpuSocket && supported.length > 0 && !supported.includes(cpuSocket)) {
        errors.push({
          rule_id: 'r0000001-0000-0000-0000-000000000006',
          rule_name: 'CPU Cooler Socket Support',
          severity: 'ERROR',
          message: `Tản nhiệt CPU không hỗ trợ gông cắm socket ${cpuSocket} của CPU hiện tại.`,
          source_product: toProductRef(cpu),
          target_product: toProductRef(cooler),
        });
      }
    }
  }

  // Rule 7: CPU -> PSU _total_tdp_w <= rated_wattage_w (WARNING)
  if (cpus.length > 0 && psus.length > 0) {
    for (const { product: psu } of psus) {
      const ratedW = toNum(psu.specs?.rated_wattage_w, 0);
      if (ratedW > 0 && estimatedTdpW > ratedW) {
        warnings.push({
          rule_id: 'r0000001-0000-0000-0000-000000000007',
          rule_name: 'PSU Wattage Sufficiency',
          severity: 'WARNING',
          message: `Tổng công suất tiêu thụ ước tính của hệ thống (${estimatedTdpW}W) vượt quá công suất định mức của bộ nguồn (${ratedW}W).`,
          source_product: null,
          target_product: toProductRef(psu),
        });
      }
    }
  }

  // Rule 8: MOTHERBOARD -> CASE form_factor IN supported_form_factors (ERROR)
  for (const { product: mb } of motherboards) {
    const formFactor = toStr(mb.specs?.form_factor).toUpperCase();
    for (const { product: pcCase } of cases) {
      const supported = toStrArray(pcCase.specs?.supported_form_factors);
      if (formFactor && supported.length > 0 && !supported.includes(formFactor)) {
        errors.push({
          rule_id: 'r0000001-0000-0000-0000-000000000008',
          rule_name: 'Mainboard Form Factor vs Case',
          severity: 'ERROR',
          message: `Kích thước bo mạch chủ ${formFactor} không lắp vừa vỏ Case (hỗ trợ chuẩn: ${supported.join(', ')}).`,
          source_product: toProductRef(mb),
          target_product: toProductRef(pcCase),
        });
      }
    }
  }

  // Rule 9: SSD_M2 -> MOTHERBOARD _count <= m2_slots (WARNING)
  if (ssds.length > 0 && motherboards.length > 0) {
    const ssdCount = ssds.reduce((sum, { qty }) => sum + qty, 0);
    const repSsd = ssds[0].product;
    for (const { product: mb } of motherboards) {
      const m2Slots = toNum(mb.specs?.m2_slots, 0);
      if (m2Slots > 0 && ssdCount > m2Slots) {
        warnings.push({
          rule_id: 'r0000001-0000-0000-0000-000000000009',
          rule_name: 'M.2 Slot Count',
          severity: 'WARNING',
          message: `Số lượng ổ cứng SSD M.2 (${ssdCount}) vượt quá số khe cắm M.2 trực tiếp trên bo mạch chủ (${m2Slots} khe).`,
          source_product: toProductRef(repSsd),
          target_product: toProductRef(mb),
        });
      }
    }
  }

  // Rule 10: GPU -> MOTHERBOARD pcie_gen <= max_pcie_gen (INFO)
  for (const { product: gpu } of gpus) {
    const gpuPcie = toNum(gpu.specs?.pcie_gen, 0);
    for (const { product: mb } of motherboards) {
      const maxPcie = toNum(mb.specs?.max_pcie_gen, 0);
      if (gpuPcie > 0 && maxPcie > 0 && gpuPcie > maxPcie) {
        info.push({
          rule_id: 'r0000001-0000-0000-0000-000000000010',
          rule_name: 'PCIe Generation',
          severity: 'INFO',
          message: `Card đồ họa chạy chuẩn PCIe ${gpuPcie} trong khi khe cắm Mainboard hỗ trợ tối đa PCIe ${maxPcie}.`,
          source_product: toProductRef(gpu),
          target_product: toProductRef(mb),
        });
      }
    }
  }

  const applyViolations = (list: CompatibilityViolation[], level: SlotStatusLevel) => {
    for (const v of list) {
      const affected = new Set<string>();
      if (v.source_product?.category_code) affected.add(v.source_product.category_code.toUpperCase());
      if (v.target_product?.category_code) affected.add(v.target_product.category_code.toUpperCase());
      affected.forEach((slotCode) => {
        const diag = slotStatuses[slotCode];
        if (!diag) return;
        if (level === 'ERROR') diag.error_count += 1;
        else if (level === 'WARNING') diag.warning_count += 1;
        else if (level === 'INFO') diag.info_count += 1;
        if (SLOT_PRIORITY[level] > SLOT_PRIORITY[diag.status]) {
          diag.status = level;
        }
        if (v.rule_id && !diag.violation_rule_ids.includes(v.rule_id)) {
          diag.violation_rule_ids.push(v.rule_id);
        }
      });
    }
  };

  applyViolations(errors, 'ERROR');
  applyViolations(warnings, 'WARNING');
  applyViolations(info, 'INFO');

  let recommendedPsuW = 0;
  let selectedPsuWattageW: number | null = null;
  let psuLoadPercent: number | null = null;

  if (selectedCoreSlots > 0) {
    const headroomW = Math.ceil((estimatedTdpW * 1.35) / 50) * 50;
    const gpuMinPsu = gpus.reduce((max, { product }) => Math.max(max, toNum(product.specs?.recommended_psu_w, 0)), 0);
    recommendedPsuW = Math.max(450, headroomW, gpuMinPsu);

    if (psus.length > 0) {
      const rated = toNum(psus[0].product.specs?.rated_wattage_w, 0);
      if (rated > 0) {
        selectedPsuWattageW = rated;
        psuLoadPercent = roundDecimals((estimatedTdpW / rated) * 100, 1);
      }
    }
  }

  const cpuScore = cpus[0]?.product.benchmark_score ?? 0;
  const gpuScore = gpus[0]?.product.benchmark_score ?? 0;
  let balanceIndex: number | null = null;
  let balanceLabel = 'CHƯA ĐỦ DỮ LIỆU';

  if (cpuScore > 0 && gpuScore > 0) {
    const diff = Math.abs(cpuScore - gpuScore);
    const pairBalance = Math.max(0, 100 - 1.2 * diff);
    balanceIndex = Math.min(100, Math.max(0, Math.round(pairBalance * 0.8 + (selectedCoreSlots / 8) * 20)));
    balanceLabel = classifyBalanceLabel(balanceIndex);
  } else if (cpuScore > 0) {
    balanceIndex = Math.min(100, Math.max(0, Math.round(cpuScore * 0.75 + selectedCoreSlots * 3)));
    balanceLabel = classifyBalanceLabel(balanceIndex);
  }

  let gateStatus: BuilderGateStatus = 'READY_SAFE';
  if (stockIssues.length > 0 || unresolvedIds.length > 0) {
    gateStatus = 'BLOCKED_OUT_OF_STOCK';
  } else if (errors.length > 0) {
    gateStatus = 'BLOCKED_COMPATIBILITY_ERROR';
  } else if (warnings.length > 0) {
    gateStatus = 'WARNING_CONFIRM_REQUIRED';
  }

  const missingRecommendedSlots = RECOMMENDED_SLOTS.filter((slot) => (byCat.get(slot)?.length ?? 0) === 0);

  const compatibility: CompatibilityResult = {
    is_compatible: errors.length === 0,
    errors,
    warnings,
    info,
    unresolved_product_ids: unresolvedIds,
  };

  const telemetry: BuildTelemetryDTO = {
    total_price: totalPrice,
    estimated_tdp_w: estimatedTdpW,
    recommended_psu_w: recommendedPsuW,
    selected_psu_wattage_w: selectedPsuWattageW,
    psu_load_percent: psuLoadPercent,
    balance_index: balanceIndex,
    balance_label: balanceLabel,
    selected_core_slots: selectedCoreSlots,
    total_core_slots: CORE_SLOTS.length,
    evaluation_time_ms: roundDecimals(performance.now() - startMs, 2),
  };

  return {
    compatibility,
    telemetry,
    slot_statuses: slotStatuses,
    gate_status: gateStatus,
    stock_issues: stockIssues,
    missing_recommended_slots: missingRecommendedSlots,
    is_offline_mock: true,
  };
}

const SINGLE_SLOT_SET = new Set(['CPU', 'MOTHERBOARD', 'GPU', 'PSU', 'CASE', 'CPU_COOLER']);

const toProductSummary = (p: AdminProductDTO): ProductSummaryDTO => ({
  product_id: p.product_id,
  name: p.name,
  brand: p.brand,
  category_code: p.category.category_code,
  category_name: p.category.category_name,
  image_url: p.image_url || '',
  price: p.price,
  in_stock: p.stock_quantity > 0,
  benchmark_score: p.benchmark_score,
  key_specs: { ...(p.specs || {}) },
});

/**
 * Lọc ứng viên linh kiện offline từ MOCK_PRODUCTS khi Backend không khả dụng ở Local Dev.
 */
export function searchSlotCandidatesOffline(
  categoryCode: string,
  request: SlotCandidateSearchRequest = {}
): PageResponse<CandidateProductDTO> {
  const normalizedCat = categoryCode.trim().toUpperCase();
  let items = MOCK_PRODUCTS.filter(
    (p) =>
      p.is_active &&
      !p.deleted_at &&
      p.category.category_code.trim().toUpperCase() === normalizedCat
  );

  if (request.in_stock_only) {
    items = items.filter((p) => p.stock_quantity > 0);
  }

  if (request.brand && request.brand.length > 0) {
    const brandSet = new Set(
      request.brand
        .flatMap((b) => b.split(','))
        .map((b) => b.trim().toUpperCase())
        .filter(Boolean)
    );
    if (brandSet.size > 0) {
      items = items.filter((p) => brandSet.has(p.brand.trim().toUpperCase()));
    }
  }

  if (request.min_price !== undefined && request.min_price !== null) {
    items = items.filter((p) => p.price >= request.min_price!);
  }
  if (request.max_price !== undefined && request.max_price !== null) {
    items = items.filter((p) => p.price <= request.max_price!);
  }

  if (request.specs) {
    Object.entries(request.specs).forEach(([specKey, rawVal]) => {
      if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') return;
      const allowed = String(rawVal)
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length === 0) return;

      items = items.filter((p) => {
        const val = p.specs?.[specKey];
        if (val === undefined || val === null) return false;
        if (Array.isArray(val)) {
          return val.some((entry) => allowed.includes(String(entry).trim().toLowerCase()));
        }
        return allowed.includes(String(val).trim().toLowerCase());
      });
    });
  }

  if (request.search && request.search.trim()) {
    const tokens = request.search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
    if (tokens.length > 0) {
      items = items.filter((p) => {
        const haystack = `${p.name} ${p.brand}`.toLowerCase();
        return tokens.some((kw) => haystack.includes(kw));
      });
    }
  }

  const sortMode = (request.sort || 'newest').toLowerCase();
  if (sortMode === 'oldest') {
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sortMode === 'price_asc') {
    items.sort((a, b) => a.price - b.price);
  } else if (sortMode === 'price_desc') {
    items.sort((a, b) => b.price - a.price);
  } else {
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const currentItems = (request.current_items || []).filter((it) => it?.product_id?.trim());
  const shouldEvaluate =
    currentItems.length > 0 && Boolean(request.compatible_only || request.evaluate_compatibility);

  let candidates: CandidateProductDTO[] = items.map((p) => {
    if (!shouldEvaluate) {
      return {
        product: toProductSummary(p),
        compat_status: 'COMPATIBLE',
        compat_summary: 'Tương thích với cấu hình hiện tại',
        blocking_errors: [],
        warnings: [],
      };
    }

    const baseItems = SINGLE_SLOT_SET.has(normalizedCat)
      ? currentItems.filter(
          (it) => (it.slot_code || '').trim().toUpperCase() !== normalizedCat
        )
      : currentItems;

    const simResult = evaluateBuildOffline([
      ...baseItems,
      { product_id: p.product_id, quantity: 1, slot_code: normalizedCat },
    ]);

    const blockingErrors = simResult.compatibility.errors.map((e) => e.message);
    const warnings = simResult.compatibility.warnings.map((w) => w.message);

    let compatStatus: SlotStatusLevel = 'COMPATIBLE';
    let compatSummary = 'Tương thích với cấu hình hiện tại';
    if (blockingErrors.length > 0) {
      compatStatus = 'ERROR';
      compatSummary = blockingErrors[0];
    } else if (warnings.length > 0) {
      compatStatus = 'WARNING';
      compatSummary = warnings[0];
    }

    return {
      product: toProductSummary(p),
      compat_status: compatStatus,
      compat_summary: compatSummary,
      blocking_errors: blockingErrors,
      warnings,
    };
  });

  if (request.compatible_only) {
    candidates = candidates.filter((c) => c.compat_status !== 'ERROR');
  }

  const page = Math.max(0, request.page ?? 0);
  const size = Math.max(1, Math.min(48, request.size ?? 12));
  const totalElements = candidates.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const pagedContent = candidates.slice(page * size, (page + 1) * size);

  return {
    content: pagedContent,
    page,
    size,
    total_elements: totalElements,
    total_pages: totalElements === 0 ? 0 : totalPages,
    first: page === 0,
    last: totalElements === 0 || page >= totalPages - 1,
  };
}

export const pcBuilderService = {
  /**
   * POST /api/v1/pc-builder/slots/{categoryCode}/candidates
   * Lọc linh kiện ứng viên theo slot kèm tìm kiếm, thông số và phân trang (WBS 7.5.1).
   */
  async searchSlotCandidates(
    categoryCode: string,
    request: SlotCandidateSearchRequest = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PageResponse<CandidateProductDTO>>> {
    try {
      const response = await apiClient.post<ApiResponse<PageResponse<CandidateProductDTO>>>(
        `/api/v1/pc-builder/slots/${encodeURIComponent(categoryCode)}/candidates`,
        request,
        { signal }
      );
      return response.data;
    } catch (error) {
      if (
        axios.isCancel(error) ||
        (error as { code?: string; name?: string })?.code === 'ERR_CANCELED' ||
        (error as { name?: string })?.name === 'AbortError'
      ) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      console.warn(
        `[pcBuilderService.searchSlotCandidates] Backend unavailable for ${categoryCode}, using offline mock candidates:`,
        error
      );
      const offlinePage = searchSlotCandidatesOffline(categoryCode, request);
      return {
        success: true,
        status_code: 200,
        message: 'Lấy danh sách linh kiện ứng viên thành công (Offline Mock)',
        data: offlinePage,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * POST /api/v1/pc-builder/evaluate
   * Đánh giá tương thích real-time, hỗ trợ AbortSignal chống stale response khi người dùng thao tác nhanh.
   */
  async evaluateBuild(
    request: PCBuilderEvaluateRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<PCBuilderEvaluateResponse>> {
    try {
      const response = await apiClient.post<ApiResponse<PCBuilderEvaluateResponse>>(
        '/api/v1/pc-builder/evaluate',
        request,
        { signal }
      );
      return response.data;
    } catch (error) {
      if (
        axios.isCancel(error) ||
        (error as { code?: string; name?: string })?.code === 'ERR_CANCELED' ||
        (error as { name?: string })?.name === 'AbortError'
      ) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      console.warn('[pcBuilderService.evaluateBuild] Backend unavailable, using offline mock evaluator:', error);
      const offlineData = evaluateBuildOffline(request.items || []);
      return {
        success: true,
        status_code: 200,
        message: 'Đánh giá cấu hình PC thành công (Offline Mock)',
        data: offlineData,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * POST /api/v1/pc-builder/quick-fix
   * Mô phỏng gợi ý linh kiện thay thế xóa xung đột tương thích (WBS 7.5.5).
   */
  async getQuickFix(
    request: QuickFixRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<QuickFixResponse>> {
    try {
      const response = await apiClient.post<ApiResponse<QuickFixResponse>>(
        '/api/v1/pc-builder/quick-fix',
        request,
        { signal }
      );
      return response.data;
    } catch (error) {
      if (
        axios.isCancel(error) ||
        (error as { code?: string; name?: string })?.code === 'ERR_CANCELED' ||
        (error as { name?: string })?.name === 'AbortError'
      ) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      console.warn('[pcBuilderService.getQuickFix] Backend unavailable, using offline quick-fix simulator:', error);
      const offlineData = getQuickFixOffline(request);
      return {
        success: true,
        status_code: 200,
        message: 'Tạo gợi ý thay thế linh kiện thành công (Offline Mock)',
        data: offlineData,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * POST /api/v1/pc-builder/add-to-cart
   * Xác thực Gatekeeper lần cuối và chuẩn hóa giá/tồn kho trọn bộ cấu hình (WBS 7.5.6).
   */
  async addBuildToCart(
    request: AddBuildToCartRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<AddBuildToCartResponseDTO>> {
    try {
      const response = await apiClient.post<ApiResponse<AddBuildToCartResponseDTO>>(
        '/api/v1/pc-builder/add-to-cart',
        request,
        { signal }
      );
      return response.data;
    } catch (error) {
      if (
        axios.isCancel(error) ||
        (error as { code?: string; name?: string })?.code === 'ERR_CANCELED' ||
        (error as { name?: string })?.name === 'AbortError'
      ) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      console.warn('[pcBuilderService.addBuildToCart] Backend unavailable, using offline cart gatekeeper:', error);
      const offlineData = addBuildToCartOffline(request);
      return {
        success: true,
        status_code: 200,
        message: 'Đã xác thực và thêm cấu hình PC vào giỏ hàng (Offline Mock)',
        data: offlineData,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * POST /api/v1/pc-builder/resolve
   * Khôi phục cấu hình chia sẻ (?items=...) kèm đánh giá tương thích mới nhất (WBS 7.5.6).
   */
  async resolveShareBuild(
    request: ResolveBuildRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<ResolveBuildResponseDTO>> {
    try {
      const response = await apiClient.post<ApiResponse<ResolveBuildResponseDTO>>(
        '/api/v1/pc-builder/resolve',
        request,
        { signal }
      );
      return response.data;
    } catch (error) {
      if (
        axios.isCancel(error) ||
        (error as { code?: string; name?: string })?.code === 'ERR_CANCELED' ||
        (error as { name?: string })?.name === 'AbortError'
      ) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      console.warn('[pcBuilderService.resolveShareBuild] Backend unavailable, using offline share resolver:', error);
      const offlineData = resolveShareBuildOffline(request);
      return {
        success: true,
        status_code: 200,
        message: 'Khôi phục cấu hình PC chia sẻ thành công (Offline Mock)',
        data: offlineData,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

export class OfflineBuilderError extends axios.AxiosError {
  isOfflineFallback = true;
  isOfflineUnavailable: boolean;

  constructor(
    status: number,
    errorCode: string,
    message: string,
    isOfflineUnavailable = false
  ) {
    super(
      message,
      errorCode,
      undefined,
      undefined,
      {
        status,
        statusText: '',
        headers: {},
        config: {} as never,
        data: {
          success: false,
          status_code: status,
          error_code: errorCode,
          message,
        },
      }
    );
    this.isOfflineUnavailable = isOfflineUnavailable;
  }
}

/**
 * Mô phỏng đẩy cấu hình vào giỏ hàng offline dựa trên MOCK_PRODUCTS và evaluateBuildOffline.
 */
export function addBuildToCartOffline(
  request: AddBuildToCartRequest
): AddBuildToCartResponseDTO {
  const mergedQty = new Map<string, { qty: number; requestedSlot?: string }>();
  for (const item of request?.items || []) {
    const cleanId = item?.product_id?.trim();
    if (!cleanId) continue;
    const qty = Math.max(1, Math.min(16, Math.floor(item.quantity || 1)));
    const prev = mergedQty.get(cleanId);
    mergedQty.set(cleanId, {
      qty: Math.min(16, (prev?.qty ?? 0) + qty),
      requestedSlot: prev?.requestedSlot || item.slot_code?.trim().toUpperCase(),
    });
  }

  if (mergedQty.size === 0) {
    throw new OfflineBuilderError(
      400,
      'BUILDER_EMPTY_CONFIG',
      'Vui lòng chọn ít nhất một linh kiện trong cấu hình PC'
    );
  }

  const mockById = new Map<string, AdminProductDTO>();
  for (const p of MOCK_PRODUCTS) {
    if (p.is_active && !p.deleted_at) {
      mockById.set(p.product_id, p);
    }
  }

  for (const id of mergedQty.keys()) {
    if (!mockById.has(id)) {
      throw new OfflineBuilderError(
        409,
        'BUILDER_PRODUCT_UNAVAILABLE',
        'Một hoặc nhiều linh kiện không tồn tại hoặc đã ngừng kinh doanh',
        true
      );
    }
  }

  const normalizedInputs: BuildItemInput[] = [];
  mergedQty.forEach((entry, id) => {
    normalizedInputs.push({
      product_id: id,
      quantity: entry.qty,
      slot_code: entry.requestedSlot,
    });
  });

  const evaluation = evaluateBuildOffline(normalizedInputs);

  if (evaluation.gate_status === 'BLOCKED_EMPTY') {
    throw new OfflineBuilderError(
      400,
      'BUILDER_EMPTY_CONFIG',
      'Vui lòng chọn ít nhất một linh kiện trong cấu hình PC'
    );
  }
  if (evaluation.gate_status === 'BLOCKED_OUT_OF_STOCK') {
    throw new OfflineBuilderError(
      409,
      'PROD_OUT_OF_STOCK',
      'Sản phẩm đã hết hàng hoặc không đủ số lượng tồn kho'
    );
  }
  if (evaluation.gate_status === 'BLOCKED_COMPATIBILITY_ERROR') {
    throw new OfflineBuilderError(
      409,
      'BUILDER_COMPATIBILITY_CONFLICT',
      'Cấu hình đang có xung đột phần cứng mức ERROR. Vui lòng khắc phục trước khi thêm vào giỏ'
    );
  }
  if (
    evaluation.gate_status === 'WARNING_CONFIRM_REQUIRED' &&
    !request?.acknowledged_warnings
  ) {
    throw new OfflineBuilderError(
      409,
      'BUILDER_WARNING_ACK_REQUIRED',
      'Cấu hình có cảnh báo kỹ thuật (WARNING). Vui lòng xác nhận rủi ro để tiếp tục'
    );
  }

  const validatedItems: ValidatedCartItemDTO[] = [];
  let subtotalPrice = 0;
  let addedItemsCount = 0;

  mergedQty.forEach((entry, id) => {
    const product = mockById.get(id)!;
    const catCode = product.category.category_code.trim().toUpperCase();
    const unitPrice = Math.max(0, product.price);
    const lineTotal = unitPrice * entry.qty;
    subtotalPrice += lineTotal;
    addedItemsCount += entry.qty;

    validatedItems.push({
      product_id: product.product_id,
      slot_code: catCode || entry.requestedSlot || 'UNKNOWN',
      name: product.name,
      category_code: catCode,
      image_url: product.image_url || '',
      unit_price: unitPrice,
      quantity: entry.qty,
      line_total: lineTotal,
      available_stock: Math.max(0, product.stock_quantity),
    });
  });

  return {
    cart_persisted: false,
    cart_id: null,
    gate_status: evaluation.gate_status,
    added_items_count: addedItemsCount,
    subtotal_price: subtotalPrice,
    items: validatedItems,
  };
}

/**
 * Mô phỏng khôi phục Share URL offline dựa trên MOCK_PRODUCTS và evaluateBuildOffline.
 */
export function resolveShareBuildOffline(
  request: ResolveBuildRequest
): ResolveBuildResponseDTO {
  const mergedQty = new Map<string, number>();
  for (const item of request?.items || []) {
    const cleanId = item?.product_id?.trim();
    if (!cleanId) continue;
    const qty = Math.max(1, Math.min(16, Math.floor(item.quantity || 1)));
    mergedQty.set(cleanId, Math.min(16, (mergedQty.get(cleanId) ?? 0) + qty));
  }

  if (mergedQty.size === 0) {
    throw new OfflineBuilderError(
      400,
      'BUILDER_EMPTY_CONFIG',
      'Vui lòng chọn ít nhất một linh kiện trong cấu hình PC'
    );
  }

  const mockById = new Map<string, AdminProductDTO>();
  for (const p of MOCK_PRODUCTS) {
    if (p.is_active && !p.deleted_at) {
      mockById.set(p.product_id, p);
    }
  }

  const resolvedItems: ResolvedSlotItemDTO[] = [];
  const droppedProductIds: string[] = [];
  const evalInputs: BuildItemInput[] = [];

  mergedQty.forEach((qty, id) => {
    const product = mockById.get(id);
    if (!product) {
      droppedProductIds.push(id);
      return;
    }

    const catCode = product.category.category_code.trim().toUpperCase();
    const effectiveQty = SINGLE_SLOT_SET.has(catCode) ? 1 : qty;

    resolvedItems.push({
      slot_code: catCode,
      quantity: effectiveQty,
      product: toProductSummary(product),
    });

    evalInputs.push({
      product_id: id,
      quantity: effectiveQty,
      slot_code: catCode,
    });
  });

  const evaluation = evaluateBuildOffline(evalInputs);

  return {
    resolved_items: resolvedItems,
    dropped_product_ids: droppedProductIds,
    evaluation,
  };
}

const QUICKFIX_SLOT_LABELS: Record<string, string> = {
  CPU: 'CPU',
  MOTHERBOARD: 'Mainboard',
  RAM: 'RAM',
  GPU: 'Card đồ họa (GPU)',
  SSD_M2: 'SSD M.2',
  SSD_SATA: 'SSD SATA 2.5"',
  PSU: 'Nguồn (PSU)',
  CASE: 'Vỏ Case',
  CPU_COOLER: 'Tản nhiệt CPU',
};

const formatQuickFixSlotLabel = (slotCode: string): string =>
  QUICKFIX_SLOT_LABELS[slotCode] || slotCode;

/**
 * Mô phỏng gợi ý Quick Fix offline dựa trên MOCK_PRODUCTS và evaluateBuildOffline.
 */
export function getQuickFixOffline(request: QuickFixRequest): QuickFixResponse {
  const startMs = performance.now();
  const targetRuleId = (request?.violation_rule_id || '').trim();
  const currentItems = (request?.current_items || []).filter((it) => it?.product_id?.trim());

  if (!targetRuleId || currentItems.length === 0) {
    return {
      violation_rule_id: targetRuleId,
      strategies: [],
      evaluation_time_ms: roundDecimals(performance.now() - startMs, 2),
      guidance_message: 'Cấu hình hiện tại chưa đủ dữ liệu để gợi ý thay thế.',
    };
  }

  const mockById = new Map<string, AdminProductDTO>();
  for (const p of MOCK_PRODUCTS) {
    if (p.is_active && !p.deleted_at) {
      mockById.set(p.product_id, p);
    }
  }

  const baseEval = evaluateBuildOffline(currentItems);
  const allViolations: CompatibilityViolation[] = [
    ...(baseEval.compatibility.errors || []),
    ...(baseEval.compatibility.warnings || []),
    ...(baseEval.compatibility.info || []),
  ];

  const matchedViolation =
    allViolations.find(
      (v) =>
        v.rule_id === targetRuleId &&
        (!request.source_product_id || v.source_product?.id === request.source_product_id) &&
        (!request.target_product_id || v.target_product?.id === request.target_product_id)
    ) || allViolations.find((v) => v.rule_id === targetRuleId);

  if (!matchedViolation) {
    return {
      violation_rule_id: targetRuleId,
      strategies: [],
      evaluation_time_ms: roundDecimals(performance.now() - startMs, 2),
      guidance_message: 'Vi phạm này không còn xuất hiện trong cấu hình hiện tại.',
    };
  }

  interface ReplaceTargetOffline {
    slotCode: string;
    oldProductId: string;
    otherProduct: CompatibilityViolation['source_product'];
  }

  const replaceTargets: ReplaceTargetOffline[] = [];
  const tgtRef = matchedViolation.target_product;
  const srcRef = matchedViolation.source_product;

  if (tgtRef?.id && mockById.has(tgtRef.id)) {
    const slot = (tgtRef.category_code || mockById.get(tgtRef.id)!.category.category_code)
      .trim()
      .toUpperCase();
    replaceTargets.push({ slotCode: slot, oldProductId: tgtRef.id, otherProduct: srcRef });
  }
  if (srcRef?.id && mockById.has(srcRef.id)) {
    const slot = (srcRef.category_code || mockById.get(srcRef.id)!.category.category_code)
      .trim()
      .toUpperCase();
    if (!replaceTargets.some((t) => t.slotCode === slot)) {
      replaceTargets.push({ slotCode: slot, oldProductId: srcRef.id, otherProduct: tgtRef });
    }
  }

  const preferredSlot = request.preferred_replace_slot?.trim().toUpperCase();
  if (preferredSlot && replaceTargets.length > 1) {
    const idx = replaceTargets.findIndex((t) => t.slotCode === preferredSlot);
    if (idx > 0) {
      const [picked] = replaceTargets.splice(idx, 1);
      replaceTargets.unshift(picked);
    }
  }

  if (replaceTargets.length === 0) {
    return {
      violation_rule_id: targetRuleId,
      strategies: [],
      evaluation_time_ms: roundDecimals(performance.now() - startMs, 2),
      guidance_message:
        'Vi phạm ở cấp toàn cấu hình không gắn với linh kiện đơn lẻ. Vui lòng bổ sung hoặc điều chỉnh linh kiện liên quan.',
    };
  }

  const limit = Math.max(1, Math.min(5, request.limit_per_strategy ?? 3));
  const baseRuleIds = new Set(allViolations.map((v) => v.rule_id).filter(Boolean));
  const strategies: QuickFixStrategyGroupDTO[] = [];

  for (const target of replaceTargets) {
    const oldProduct = mockById.get(target.oldProductId);
    if (!oldProduct) continue;

    const oldItem = currentItems.find((it) => it.product_id === target.oldProductId);
    const qty = Math.max(1, oldItem?.quantity ?? 1);

    const pool = MOCK_PRODUCTS.filter(
      (p) =>
        p.is_active &&
        !p.deleted_at &&
        p.stock_quantity >= qty &&
        p.product_id !== target.oldProductId &&
        p.category.category_code.trim().toUpperCase() === target.slotCode
    )
      .sort((a, b) => {
        const diff = Math.abs(a.price - oldProduct.price) - Math.abs(b.price - oldProduct.price);
        if (diff !== 0) return diff;
        return (b.benchmark_score ?? 0) - (a.benchmark_score ?? 0);
      })
      .slice(0, 80);

    const accepted: Array<QuickFixOptionDTO & { _bench: number }> = [];

    for (const candidate of pool) {
      const hasCandidateAlready = currentItems.some((it) => it.product_id === candidate.product_id);
      const hypotheticalItems: BuildItemInput[] = hasCandidateAlready
        ? currentItems
            .filter((it) => it.product_id !== target.oldProductId)
            .map((it) =>
              it.product_id === candidate.product_id
                ? { ...it, quantity: Math.min(16, (it.quantity || 1) + qty) }
                : it
            )
        : currentItems.map((it) =>
            it.product_id === target.oldProductId
              ? { product_id: candidate.product_id, quantity: qty, slot_code: target.slotCode }
              : it
          );

      const sim = evaluateBuildOffline(hypotheticalItems);
      const simErrors = sim.compatibility.errors || [];
      const simWarnings = sim.compatibility.warnings || [];
      const simInfo = sim.compatibility.info || [];

      if (simErrors.length > 0) continue;
      if (simErrors.some((v) => v.rule_id === targetRuleId)) continue;
      if (simWarnings.some((v) => v.rule_id === targetRuleId)) continue;
      if (matchedViolation.severity === 'INFO' && simInfo.some((v) => v.rule_id === targetRuleId)) {
        continue;
      }

      const simRuleIds = new Set(
        [...simErrors, ...simWarnings, ...simInfo].map((v) => v.rule_id).filter(Boolean)
      );
      let clearedCount = 0;
      baseRuleIds.forEach((id) => {
        if (!simRuleIds.has(id)) clearedCount += 1;
      });

      const remainingWarningsCount = simWarnings.length;
      accepted.push({
        product: toProductSummary(candidate),
        price_delta: candidate.price - oldProduct.price,
        resulting_status: remainingWarningsCount > 0 ? 'WARNING' : 'COMPATIBLE',
        remaining_warnings_count: remainingWarningsCount,
        cleared_violation_count: Math.max(1, clearedCount),
        _bench: candidate.benchmark_score ?? 0,
      });
    }

    accepted.sort((a, b) => {
      if (a.remaining_warnings_count !== b.remaining_warnings_count) {
        return a.remaining_warnings_count - b.remaining_warnings_count;
      }
      const absDiff = Math.abs(a.price_delta) - Math.abs(b.price_delta);
      if (absDiff !== 0) return absDiff;
      return b._bench - a._bench;
    });

    const topOptions: QuickFixOptionDTO[] = accepted.slice(0, limit).map(({ _bench, ...opt }) => opt);
    if (topOptions.length > 0) {
      const otherText = target.otherProduct?.name
        ? ` với ${target.otherProduct.category_code ? formatQuickFixSlotLabel(target.otherProduct.category_code.toUpperCase()) + ' ' : ''}${target.otherProduct.name}`
        : ' với cấu hình hiện tại';
      strategies.push({
        replace_slot: target.slotCode,
        current_product_id: oldProduct.product_id,
        current_product_name: oldProduct.name,
        strategy_label: `Đổi ${formatQuickFixSlotLabel(target.slotCode)}${target.otherProduct?.name ? ' tương thích' : ' phù hợp'}${otherText}`,
        options: topOptions,
      });
    }
  }

  return {
    violation_rule_id: targetRuleId,
    strategies,
    evaluation_time_ms: roundDecimals(performance.now() - startMs, 2),
    guidance_message:
      strategies.length === 0
        ? 'Không tìm thấy linh kiện thay thế khả dụng trong kho để khắc phục xung đột này.'
        : null,
  };
}
