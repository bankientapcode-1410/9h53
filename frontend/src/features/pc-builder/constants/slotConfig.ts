import type {
  AllBuilderSlotCode,
  BuilderSlotCode,
  PeripheralSlotCode,
  SelectedSlotItem,
  SlotMetadata,
} from '@/features/pc-builder/types/builder.types';

export const MAX_DISTINCT_BUILD_PRODUCTS = 30;
export const MAX_SLOT_QUANTITY = 16;

export const CORE_SLOT_CONFIGS: SlotMetadata[] = [
  {
    slot_code: 'CPU',
    display_order: 1,
    display_name: 'Bộ vi xử lý (CPU)',
    short_name: 'CPU',
    selection_mode: 'SINGLE',
    max_total_qty: 1,
    required_hint: 'Bắt buộc',
    is_core: true,
    cta_label: 'Chọn CPU',
    empty_hint: 'Chọn bộ vi xử lý Intel hoặc AMD làm nền tảng cấu hình',
    highlight_specs: [
      { key: 'socket_type', label: 'Socket' },
      { key: 'core_count', label: 'Số nhân', unit: 'nhân' },
      { key: 'tdp_w', label: 'TDP', unit: 'W' },
    ],
  },
  {
    slot_code: 'MOTHERBOARD',
    display_order: 2,
    display_name: 'Bo mạch chủ (Mainboard)',
    short_name: 'Mainboard',
    selection_mode: 'SINGLE',
    max_total_qty: 1,
    required_hint: 'Bắt buộc',
    is_core: true,
    cta_label: 'Chọn Mainboard',
    empty_hint: 'Bo mạch chủ phải khớp Socket CPU và chuẩn RAM dự kiến',
    highlight_specs: [
      { key: 'supported_sockets', label: 'Socket' },
      { key: 'form_factor', label: 'Chuẩn' },
      { key: 'supported_memory_types', label: 'RAM' },
    ],
  },
  {
    slot_code: 'RAM',
    display_order: 3,
    display_name: 'Bộ nhớ trong (RAM)',
    short_name: 'RAM',
    selection_mode: 'MULTI',
    max_total_qty: MAX_SLOT_QUANTITY,
    required_hint: 'Bắt buộc',
    is_core: true,
    cta_label: 'Chọn RAM',
    empty_hint: 'Hỗ trợ chọn nhiều kit RAM (tổng số lượng tối đa 16)',
    highlight_specs: [
      { key: 'memory_type', label: 'Chuẩn' },
      { key: 'capacity_gb', label: 'Dung lượng', unit: 'GB' },
      { key: 'bus_speed_mhz', label: 'Bus', unit: 'MHz' },
      { key: 'modules_per_kit', label: 'Số thanh', unit: 'thanh' },
    ],
  },
  {
    slot_code: 'GPU',
    display_order: 4,
    display_name: 'Card đồ họa (VGA)',
    short_name: 'Card đồ họa',
    selection_mode: 'SINGLE',
    max_total_qty: 1,
    required_hint: 'Khuyến nghị',
    is_core: true,
    cta_label: 'Chọn Card đồ họa',
    empty_hint: 'Tăng hiệu năng Gaming, Render & AI (tùy chọn nếu CPU có iGPU)',
    highlight_specs: [
      { key: 'vram_gb', label: 'VRAM', unit: 'GB' },
      { key: 'length_mm', label: 'Chiều dài', unit: 'mm' },
      { key: 'tdp_w', label: 'TDP', unit: 'W' },
    ],
  },
  {
    slot_code: 'SSD_M2',
    display_order: 5,
    display_name: 'Ổ cứng SSD M.2 NVMe',
    short_name: 'SSD M.2',
    selection_mode: 'MULTI',
    max_total_qty: MAX_SLOT_QUANTITY,
    required_hint: 'Bắt buộc',
    is_core: true,
    cta_label: 'Chọn Ổ cứng SSD',
    empty_hint: 'Hỗ trợ lắp nhiều ổ NVMe M.2 tùy theo số khe trên Mainboard',
    highlight_specs: [
      { key: 'interface_type', label: 'Chuẩn' },
      { key: 'capacity_gb', label: 'Dung lượng', unit: 'GB' },
      { key: 'read_speed_mbps', label: 'Đọc', unit: 'MB/s' },
    ],
  },
  {
    slot_code: 'SSD_SATA',
    display_order: 6,
    display_name: 'Ổ cứng SSD SATA 2.5"',
    short_name: 'SSD SATA 2.5"',
    selection_mode: 'MULTI',
    max_total_qty: MAX_SLOT_QUANTITY,
    required_hint: 'Tùy chọn',
    is_core: false,
    cta_label: 'Chọn SSD SATA 2.5"',
    empty_hint: 'Bổ sung dung lượng lưu trữ bằng ổ SSD 2.5" SATA III (tối đa 16 ổ, không chiếm khe M.2)',
    highlight_specs: [
      { key: 'interface_type', label: 'Chuẩn' },
      { key: 'capacity_gb', label: 'Dung lượng', unit: 'GB' },
      { key: 'read_speed_mbps', label: 'Đọc', unit: 'MB/s' },
    ],
  },
  {
    slot_code: 'PSU',
    display_order: 7,
    display_name: 'Nguồn máy tính (PSU)',
    short_name: 'Nguồn PSU',
    selection_mode: 'SINGLE',
    max_total_qty: 1,
    required_hint: 'Bắt buộc',
    is_core: true,
    cta_label: 'Chọn Nguồn (PSU)',
    empty_hint: 'Đảm bảo công suất thực đủ gánh toàn bộ hệ thống + headroom 35%',
    highlight_specs: [
      { key: 'rated_wattage_w', label: 'Công suất', unit: 'W' },
      { key: 'efficiency_rating', label: 'Chứng nhận' },
    ],
  },
  {
    slot_code: 'CASE',
    display_order: 8,
    display_name: 'Vỏ máy tính (Case)',
    short_name: 'Vỏ Case',
    selection_mode: 'SINGLE',
    max_total_qty: 1,
    required_hint: 'Bắt buộc',
    is_core: true,
    cta_label: 'Chọn Vỏ Case',
    empty_hint: 'Kiểm tra vừa kích thước Mainboard, chiều dài VGA và tản nhiệt',
    highlight_specs: [
      { key: 'supported_form_factors', label: 'Hỗ trợ Main' },
      { key: 'max_gpu_length_mm', label: 'VGA tối đa', unit: 'mm' },
    ],
  },
  {
    slot_code: 'CPU_COOLER',
    display_order: 9,
    display_name: 'Tản nhiệt CPU',
    short_name: 'Tản nhiệt',
    selection_mode: 'SINGLE',
    max_total_qty: 1,
    required_hint: 'Tùy chọn',
    is_core: true,
    cta_label: 'Chọn Tản nhiệt CPU',
    empty_hint: 'Khuyến nghị cho CPU hiệu năng cao không kèm tản nhiệt hộp',
    highlight_specs: [
      { key: 'cooler_type', label: 'Loại' },
      { key: 'supported_sockets', label: 'Socket' },
      { key: 'height_mm', label: 'Chiều cao', unit: 'mm' },
    ],
  },
];

export const PERIPHERAL_SLOT_CONFIGS: SlotMetadata[] = [
  {
    slot_code: 'MONITOR',
    display_order: 10,
    display_name: 'Màn hình máy tính (Monitor)',
    short_name: 'Màn hình',
    selection_mode: 'MULTI',
    max_total_qty: MAX_SLOT_QUANTITY,
    required_hint: 'Tùy chọn',
    is_core: false,
    cta_label: 'Chọn Màn hình',
    empty_hint: 'Thêm 1 hoặc nhiều màn hình đi kèm bộ máy',
    highlight_specs: [
      { key: 'screen_size_inch', label: 'Kích thước', unit: 'inch' },
      { key: 'resolution', label: 'Độ phân giải' },
      { key: 'refresh_rate_hz', label: 'Tần số quét', unit: 'Hz' },
      { key: 'panel_type', label: 'Tấm nền' },
    ],
  },
  {
    slot_code: 'KEYBOARD',
    display_order: 11,
    display_name: 'Bàn phím cơ (Keyboard)',
    short_name: 'Bàn phím',
    selection_mode: 'MULTI',
    max_total_qty: MAX_SLOT_QUANTITY,
    required_hint: 'Tùy chọn',
    is_core: false,
    cta_label: 'Chọn Bàn phím',
    empty_hint: 'Bàn phím cơ Gaming hoặc văn phòng tùy chọn',
    highlight_specs: [
      { key: 'layout', label: 'Layout' },
      { key: 'switch_type', label: 'Switch' },
      { key: 'connection_type', label: 'Kết nối' },
    ],
  },
  {
    slot_code: 'MOUSE',
    display_order: 12,
    display_name: 'Chuột máy tính (Mouse)',
    short_name: 'Chuột',
    selection_mode: 'MULTI',
    max_total_qty: MAX_SLOT_QUANTITY,
    required_hint: 'Tùy chọn',
    is_core: false,
    cta_label: 'Chọn Chuột',
    empty_hint: 'Chuột không dây hoặc có dây độ nhạy DPI cao',
    highlight_specs: [
      { key: 'dpi', label: 'Độ nhạy', unit: 'DPI' },
      { key: 'connection_type', label: 'Kết nối' },
      { key: 'weight_g', label: 'Trọng lượng', unit: 'g' },
    ],
  },
];

export const ALL_SLOT_CONFIGS: SlotMetadata[] = [
  ...CORE_SLOT_CONFIGS,
  ...PERIPHERAL_SLOT_CONFIGS,
];

/** Tổng số khe linh kiện cốt lõi chuẩn (8 khe có is_core = true) */
export const TOTAL_CORE_SLOTS: number = CORE_SLOT_CONFIGS.filter(
  (slot) => slot.is_core
).length;

export const CORE_SLOT_CODES: BuilderSlotCode[] = CORE_SLOT_CONFIGS.map(
  (slot) => slot.slot_code as BuilderSlotCode
);

export const PERIPHERAL_SLOT_CODES: PeripheralSlotCode[] = PERIPHERAL_SLOT_CONFIGS.map(
  (slot) => slot.slot_code as PeripheralSlotCode
);

export const ALL_SLOT_CONFIG_MAP: Record<AllBuilderSlotCode, SlotMetadata> =
  ALL_SLOT_CONFIGS.reduce(
    (acc, slot) => {
      acc[slot.slot_code] = slot;
      return acc;
    },
    {} as Record<AllBuilderSlotCode, SlotMetadata>
  );

const CORE_SET = new Set<string>(CORE_SLOT_CODES);
const PERIPHERAL_SET = new Set<string>(PERIPHERAL_SLOT_CODES);

export function isCoreSlotCode(code: string): code is BuilderSlotCode {
  return CORE_SET.has(code.trim().toUpperCase());
}

export function isPeripheralSlotCode(code: string): code is PeripheralSlotCode {
  return PERIPHERAL_SET.has(code.trim().toUpperCase());
}

export function isBuilderSlotCode(code: string): code is AllBuilderSlotCode {
  const normalized = code.trim().toUpperCase();
  return CORE_SET.has(normalized) || PERIPHERAL_SET.has(normalized);
}

export function createEmptyCoreSlots(): Record<BuilderSlotCode, SelectedSlotItem[]> {
  return {
    CPU: [],
    MOTHERBOARD: [],
    RAM: [],
    GPU: [],
    SSD_M2: [],
    SSD_SATA: [],
    PSU: [],
    CASE: [],
    CPU_COOLER: [],
  };
}

export function createEmptyPeripherals(): Record<PeripheralSlotCode, SelectedSlotItem[]> {
  return {
    MONITOR: [],
    KEYBOARD: [],
    MOUSE: [],
  };
}
