import type {
  CompatibilityResult,
  CompatibilityViolation,
} from '@/features/admin/rules/types/rule.types';
import type { ProductSummaryDTO } from '@/features/product-catalog/types/product.types';

export type BuilderSlotCode =
  | 'CPU'
  | 'MOTHERBOARD'
  | 'RAM'
  | 'GPU'
  | 'SSD_M2'
  | 'SSD_SATA'
  | 'PSU'
  | 'CASE'
  | 'CPU_COOLER';

export type PeripheralSlotCode = 'MONITOR' | 'KEYBOARD' | 'MOUSE';

export type AllBuilderSlotCode = BuilderSlotCode | PeripheralSlotCode;

export type SlotStatusLevel =
  | 'EMPTY'
  | 'COMPATIBLE'
  | 'INFO'
  | 'WARNING'
  | 'ERROR';

export type BuilderGateStatus =
  | 'BLOCKED_EMPTY'
  | 'BLOCKED_OUT_OF_STOCK'
  | 'BLOCKED_COMPATIBILITY_ERROR'
  | 'WARNING_CONFIRM_REQUIRED'
  | 'READY_SAFE';

export interface BuildItemInput {
  product_id: string;
  quantity: number;
  slot_code?: string;
}

export interface BuildTelemetryDTO {
  total_price: number;
  estimated_tdp_w: number;
  recommended_psu_w: number;
  selected_psu_wattage_w: number | null;
  psu_load_percent: number | null;
  balance_index: number | null;
  balance_label: string;
  selected_core_slots: number;
  total_core_slots: number;
  evaluation_time_ms: number;
}

export interface SlotDiagnosticDTO {
  status: SlotStatusLevel;
  error_count: number;
  warning_count: number;
  info_count: number;
  violation_rule_ids: string[];
}

export interface StockIssueDTO {
  product_id: string;
  name: string;
  slot_code: string;
  requested_quantity: number;
  available_stock: number;
  reason: string;
}

export interface PCBuilderEvaluateResponse {
  compatibility: CompatibilityResult;
  telemetry: BuildTelemetryDTO;
  slot_statuses: Record<string, SlotDiagnosticDTO>;
  gate_status: BuilderGateStatus;
  stock_issues: StockIssueDTO[];
  missing_recommended_slots: string[];
  is_offline_mock?: boolean;
}

export interface AskAIBuildEventDetail {
  /** Prompt tiếng Việt đã tóm tắt các linh kiện đang chọn, TDP và danh sách lỗi/cảnh báo */
  prompt: string;
  /** Danh sách product_id đang chọn để AI Chat có thêm ngữ cảnh nếu cần */
  build_items: Array<{
    slot_code: string;
    product_id: string;
    name: string;
    quantity: number;
  }>;
  /** Cờ yêu cầu AIChatWidget mở drawer ngay và gửi prompt tự động */
  auto_send: boolean;
}

export type { CompatibilityResult, CompatibilityViolation };

export interface PCBuilderEvaluateRequest {
  items: BuildItemInput[];
}

// =========================================================================
// WBS 7.5.1: Slot Picker, Configuration Store & Candidate Search Types
// =========================================================================

export type SlotSelectionMode = 'SINGLE' | 'MULTI';

export type SlotRequiredHint = 'Bắt buộc' | 'Khuyến nghị' | 'Tùy chọn';

export interface SlotHighlightSpec {
  key: string;
  label: string;
  unit?: string;
}

export interface SlotMetadata {
  slot_code: AllBuilderSlotCode;
  display_order: number;
  display_name: string;
  short_name: string;
  selection_mode: SlotSelectionMode;
  max_total_qty: number;
  required_hint: SlotRequiredHint;
  is_core: boolean;
  cta_label: string;
  empty_hint: string;
  highlight_specs: SlotHighlightSpec[];
}

export interface SelectedSlotItem {
  product: ProductSummaryDTO;
  quantity: number;
}

export type BuilderSlotItem = SelectedSlotItem;

export type CandidateSortOption =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc';

export interface SlotCandidateSearchRequest {
  current_items?: BuildItemInput[];
  search?: string;
  brand?: string[];
  min_price?: number;
  max_price?: number;
  specs?: Record<string, string>;
  compatible_only?: boolean;
  evaluate_compatibility?: boolean;
  in_stock_only?: boolean;
  sort?: CandidateSortOption;
  page?: number;
  size?: number;
}

export interface CandidateProductDTO {
  product: ProductSummaryDTO;
  compat_status: SlotStatusLevel;
  compat_summary: string;
  blocking_errors: string[];
  warnings: string[];
}

// =========================================================================
// WBS 7.5.5: Quick Fix Suggestions & Counterfactual Pre-check Types
// =========================================================================

export interface QuickFixRequest {
  current_items: BuildItemInput[];
  violation_rule_id: string;
  source_product_id?: string | null;
  target_product_id?: string | null;
  preferred_replace_slot?: string | null;
  limit_per_strategy?: number;
}

export interface QuickFixOptionDTO {
  product: ProductSummaryDTO;
  price_delta: number;
  resulting_status: SlotStatusLevel;
  remaining_warnings_count: number;
  cleared_violation_count: number;
}

export interface QuickFixStrategyGroupDTO {
  replace_slot: string;
  current_product_id: string;
  current_product_name: string;
  strategy_label: string;
  options: QuickFixOptionDTO[];
}

export interface QuickFixResponse {
  violation_rule_id: string;
  strategies: QuickFixStrategyGroupDTO[];
  evaluation_time_ms: number;
  guidance_message?: string | null;
}

// =========================================================================
// WBS 7.5.4: Risk Gatekeeper & Confirmation Modal Types
// =========================================================================

export type ViolationDetail = CompatibilityViolation;

export interface RiskConfirmationModalProps {
  isOpen: boolean;
  warnings: ViolationDetail[];
  totalPrice: number;
  isSubmitting: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

// =========================================================================
// WBS 7.5.6: Add-to-Cart, Guest Cart & Share URL Resolve Types
// =========================================================================

export interface AddBuildToCartRequest {
  items: BuildItemInput[];
  acknowledged_warnings: boolean;
}

export interface ResolveBuildRequest {
  items: BuildItemInput[];
}

export interface ValidatedCartItemDTO {
  product_id: string;
  slot_code: string;
  name: string;
  category_code: string;
  image_url: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  available_stock: number;
}

export interface AddBuildToCartResponseDTO {
  cart_persisted: boolean;
  cart_id: string | null;
  gate_status: BuilderGateStatus;
  added_items_count: number;
  subtotal_price: number;
  items: ValidatedCartItemDTO[];
}

export interface ResolvedSlotItemDTO {
  slot_code: string;
  quantity: number;
  product: ProductSummaryDTO;
}

export interface ResolveBuildResponseDTO {
  resolved_items: ResolvedSlotItemDTO[];
  dropped_product_ids: string[];
  evaluation: PCBuilderEvaluateResponse;
}




