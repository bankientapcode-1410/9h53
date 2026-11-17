import React, { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Info,
  Loader2,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  AskAIBuildEventDetail,
  BuildItemInput,
  CompatibilityViolation,
  PCBuilderEvaluateResponse,
} from '@/features/pc-builder/types/builder.types';
import { CORE_SLOT_CODES } from '@/features/pc-builder/constants/slotConfig';
import { MOCK_PRODUCTS } from '@/services/mockData';

export interface BuildItemDetailInput {
  slot_code: string;
  product_id: string;
  name: string;
  quantity: number;
  price?: number;
}

export interface RuleDiagnosticsSidebarProps {
  evaluation: PCBuilderEvaluateResponse | null;
  selectedItems: BuildItemInput[];
  onFocusSlot: (slotCode: string) => void;
  selectedItemsDetails?: BuildItemDetailInput[];
  isEvaluating?: boolean;
}

const CORE_SLOT_SET = new Set<string>(CORE_SLOT_CODES);
const MOCK_PRODUCT_MAP = new Map(
  MOCK_PRODUCTS.map((p) => [p.product_id, p])
);

const formatVnd = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;

/**
 * Xác định khe linh kiện mục tiêu khi click thẻ vi phạm ở Sidebar (Sub-DD 7.5.3 §3.3).
 */
export function resolveTargetSlot(violation: CompatibilityViolation): string {
  const targetCat = violation.target_product?.category_code
    ?.trim()
    .toUpperCase();
  if (targetCat && CORE_SLOT_SET.has(targetCat)) {
    return targetCat;
  }

  const sourceCat = violation.source_product?.category_code
    ?.trim()
    .toUpperCase();
  if (sourceCat && CORE_SLOT_SET.has(sourceCat)) {
    return sourceCat;
  }

  if (targetCat) return targetCat;
  if (sourceCat) return sourceCat;

  const hint = `${violation.rule_id ?? ''} ${violation.rule_name ?? ''} ${violation.message ?? ''}`.toLowerCase();
  if (
    hint.includes('psu') ||
    hint.includes('watt') ||
    hint.includes('công suất') ||
    hint.includes('nguồn')
  ) {
    return 'PSU';
  }

  return 'SLOT_LIST';
}

function touchesPsuRule(violation: CompatibilityViolation): boolean {
  const srcCat = violation.source_product?.category_code?.trim().toUpperCase();
  const tgtCat = violation.target_product?.category_code?.trim().toUpperCase();
  if (srcCat === 'PSU' || tgtCat === 'PSU') {
    return true;
  }
  const ruleId = (violation.rule_id ?? '').toLowerCase();
  const ruleName = (violation.rule_name ?? '').toLowerCase();
  return (
    ruleId.includes('psu') ||
    ruleName.includes('psu') ||
    ruleId === 'r0000001-0000-0000-0000-000000000007'
  );
}

/**
 * Tổng hợp prompt tiếng Việt gửi sang AIChatWidget (Sub-DD 7.5.3 §4.2).
 */
export function buildAIPrompt(
  evaluation: PCBuilderEvaluateResponse | null,
  items: BuildItemDetailInput[]
): string {
  const itemLines = items.map(
    (item) => `- ${item.slot_code}: ${item.name} (SL: ${item.quantity})`
  );

  const estimatedTdpW = evaluation?.telemetry?.estimated_tdp_w ?? 0;
  const computedLocalBudget = items.reduce(
    (sum, item) => sum + (item.price ?? 0) * item.quantity,
    0
  );
  const totalPrice = evaluation?.telemetry?.total_price ?? computedLocalBudget;

  const errors = evaluation?.compatibility?.errors ?? [];
  const warnings = evaluation?.compatibility?.warnings ?? [];

  const errorSummary =
    errors.length > 0
      ? ` (${errors.map((e) => e.message).join('; ')})`
      : '';
  const warningSummary =
    warnings.length > 0
      ? ` (${warnings.map((w) => w.message).join('; ')})`
      : '';

  return [
    'Tôi đang lắp cấu hình PC trên SmartPC Builder:',
    ...itemLines,
    `- Tổng công suất ước tính: ${estimatedTdpW}W | Ngân sách hiện tại: ${formatVnd(totalPrice)}`,
    `Hệ thống Rule Engine báo ${errors.length} LỖI${errorSummary} và ${warnings.length} CẢNH BÁO${warningSummary}.`,
    'Hãy tư vấn giúp tôi nên đổi linh kiện nào tối ưu nhất về hiệu năng/giá?',
  ].join('\n');
}

interface ViolationSectionConfig {
  key: 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  cardClass: string;
  badgeClass: string;
  headingClass: string;
  Icon: React.FC<{ className?: string }>;
}

const SECTION_CONFIGS: Record<'ERROR' | 'WARNING' | 'INFO', ViolationSectionConfig> = {
  ERROR: {
    key: 'ERROR',
    title: 'Xung đột nghiêm trọng',
    cardClass:
      'border-smart-red bg-red-50/90 text-red-900 hover:bg-red-100/70',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    headingClass: 'text-smart-red',
    Icon: XCircle,
  },
  WARNING: {
    key: 'WARNING',
    title: 'Cần lưu ý / Rủi ro',
    cardClass:
      'border-amber-400 bg-amber-50/90 text-amber-900 hover:bg-amber-100/70',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    headingClass: 'text-amber-700',
    Icon: AlertTriangle,
  },
  INFO: {
    key: 'INFO',
    title: 'Thông tin kỹ thuật',
    cardClass:
      'border-blue-300 bg-blue-50/80 text-slate-800 hover:bg-blue-100/60',
    badgeClass: 'bg-blue-100 text-smart-blue border-blue-200',
    headingClass: 'text-smart-blue',
    Icon: Info,
  },
};

export const RuleDiagnosticsSidebar: React.FC<RuleDiagnosticsSidebarProps> = ({
  evaluation,
  selectedItems,
  onFocusSlot,
  selectedItemsDetails,
  isEvaluating = false,
}) => {
  const errors = evaluation?.compatibility?.errors ?? [];
  const warnings = evaluation?.compatibility?.warnings ?? [];
  const info = evaluation?.compatibility?.info ?? [];
  const recommendedPsuW = evaluation?.telemetry?.recommended_psu_w ?? 0;

  const showPsuAdvisory = useMemo(
    () =>
      errors.some(touchesPsuRule) ||
      warnings.some(touchesPsuRule),
    [errors, warnings]
  );

  // Resolve product names & slot codes safely whether or not selectedItemsDetails is supplied
  const resolvedItems: BuildItemDetailInput[] = useMemo(() => {
    if (selectedItemsDetails && selectedItemsDetails.length > 0) {
      return selectedItemsDetails;
    }

    const refNameById = new Map<string, { name: string; slot?: string }>();
    for (const v of [...errors, ...warnings, ...info]) {
      if (v.source_product?.id) {
        refNameById.set(v.source_product.id, {
          name: v.source_product.name,
          slot: v.source_product.category_code,
        });
      }
      if (v.target_product?.id) {
        refNameById.set(v.target_product.id, {
          name: v.target_product.name,
          slot: v.target_product.category_code,
        });
      }
    }

    return selectedItems.map((item) => {
      const fromRef = refNameById.get(item.product_id);
      const fromMock = MOCK_PRODUCT_MAP.get(item.product_id);
      const explicitName = (item as BuildItemInput & { name?: string }).name;
      const slotCode =
        item.slot_code ||
        fromRef?.slot ||
        fromMock?.category?.category_code ||
        'LINH_KIEN';
      const name =
        explicitName ||
        fromRef?.name ||
        fromMock?.name ||
        item.product_id;

      return {
        slot_code: slotCode,
        product_id: item.product_id,
        name,
        quantity: item.quantity,
        price: fromMock?.price,
      };
    });
  }, [selectedItemsDetails, selectedItems, errors, warnings, info]);

  const handleAskAI = () => {
    if (selectedItems.length === 0) return;

    const prompt = buildAIPrompt(evaluation, resolvedItems);
    const detail: AskAIBuildEventDetail = {
      prompt,
      build_items: resolvedItems.map((item) => ({
        slot_code: item.slot_code,
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
      })),
      auto_send: true,
    };

    window.dispatchEvent(
      new CustomEvent<AskAIBuildEventDetail>('smartpc:ask-ai-build', {
        detail,
      })
    );
  };

  const renderViolationCard = (
    violation: CompatibilityViolation,
    config: ViolationSectionConfig,
    index: number
  ) => {
    const targetSlot = resolveTargetSlot(violation);
    const { Icon } = config;
    const relationLabel =
      violation.source_product && violation.target_product
        ? `${violation.source_product.category_code ?? ''} ↔ ${violation.target_product.category_code ?? ''}`
        : violation.target_product?.category_code ||
          violation.source_product?.category_code ||
          'Hệ thống';

    return (
      <button
        key={`${config.key}-${violation.rule_id ?? violation.rule_name}-${index}`}
        type="button"
        data-testid={`diagnostic-card-${config.key}`}
        onClick={() => onFocusSlot(targetSlot)}
        className={`w-full text-left rounded-xl border p-3 transition shadow-xs cursor-pointer group ${config.cardClass}`}
      >
        <div className="flex items-start gap-2.5">
          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold leading-snug">
                {violation.rule_name}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 ${config.badgeClass}`}
              >
                <span>{targetSlot === 'SLOT_LIST' ? relationLabel : targetSlot}</span>
                <ArrowUpRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-95">
              {violation.message}
            </p>
          </div>
        </div>
      </button>
    );
  };

  const isEmptyEvaluation =
    evaluation === null ||
    (selectedItems.length === 0 &&
      evaluation.gate_status === 'BLOCKED_EMPTY' &&
      errors.length === 0 &&
      warnings.length === 0 &&
      info.length === 0);

  const hasAnyDiagnostics =
    errors.length > 0 || warnings.length > 0 || info.length > 0 || showPsuAdvisory;

  const displayTotalPrice =
    evaluation?.telemetry?.total_price ??
    resolvedItems.reduce((sum, it) => sum + (it.price ?? 0) * it.quantity, 0);

  return (
    <div
      id="builder-diagnostics-sidebar"
      data-testid="rule-diagnostics-sidebar"
      className="lg:sticky lg:top-28 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-blue-50 text-smart-blue border border-blue-200/80 flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-smart-navy leading-tight">
              Chẩn đoán Tương thích
            </h2>
            <p className="text-[11px] text-slate-500">
              Nhấn thẻ để cuộn tới linh kiện
            </p>
          </div>
        </div>

        {isEvaluating && (
          <Loader2
            data-testid="sidebar-evaluating-spinner"
            className="w-4 h-4 text-smart-blue animate-spin flex-shrink-0"
          />
        )}
      </div>

      {/* Body */}
      {isEmptyEvaluation ? (
        <div
          data-testid="diagnostics-empty-state"
          className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 space-y-2"
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            Hãy bắt đầu bằng cách chọn <strong className="text-smart-navy">CPU</strong> hoặc{' '}
            <strong className="text-smart-navy">Bo mạch chủ</strong>. Kết quả kiểm tra tương thích từ Rule Engine sẽ hiển thị tự động tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. ERROR Group */}
          {errors.length > 0 && (
            <section
              data-testid="diagnostics-group-error"
              aria-label="Xung đột nghiêm trọng"
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3
                  className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${SECTION_CONFIGS.ERROR.headingClass}`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>
                    {SECTION_CONFIGS.ERROR.title} ({errors.length})
                  </span>
                </h3>
              </div>
              <div className="space-y-2">
                {errors.map((violation, idx) =>
                  renderViolationCard(violation, SECTION_CONFIGS.ERROR, idx)
                )}
              </div>
            </section>
          )}

          {/* 2. PSU Advisory Box + WARNING Group */}
          {(showPsuAdvisory || warnings.length > 0) && (
            <section
              data-testid="diagnostics-group-warning"
              aria-label="Cần lưu ý / Rủi ro"
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3
                  className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${SECTION_CONFIGS.WARNING.headingClass}`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    {SECTION_CONFIGS.WARNING.title} ({warnings.length})
                  </span>
                </h3>
              </div>

              {showPsuAdvisory && (
                <div
                  data-testid="psu-advisory-box"
                  className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950 space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                      <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      Khuyên dùng PSU công suất cao hơn
                    </span>
                    {recommendedPsuW > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 text-[10px] font-black">
                        ≥ {recommendedPsuW}W
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {recommendedPsuW > 0
                      ? `Để vận hành ổn định và có khoảng dự phòng an toàn, hệ thống khuyến nghị bộ nguồn công suất thực ≥ ${recommendedPsuW}W.`
                      : 'Công suất nguồn hiện tại chưa tối ưu cho cấu hình. Khuyến nghị chọn PSU công suất thực cao hơn.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onFocusSlot('PSU')}
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 underline underline-offset-2 hover:text-amber-700"
                  >
                    <span>Đi tới khe Nguồn (PSU)</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {warnings.map((violation, idx) =>
                  renderViolationCard(violation, SECTION_CONFIGS.WARNING, idx)
                )}
              </div>
            </section>
          )}

          {/* 3. INFO Group */}
          {info.length > 0 && (
            <section
              data-testid="diagnostics-group-info"
              aria-label="Thông tin kỹ thuật"
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3
                  className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${SECTION_CONFIGS.INFO.headingClass}`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>
                    {SECTION_CONFIGS.INFO.title} ({info.length})
                  </span>
                </h3>
              </div>
              <div className="space-y-2">
                {info.map((violation, idx) =>
                  renderViolationCard(violation, SECTION_CONFIGS.INFO, idx)
                )}
              </div>
            </section>
          )}

          {/* 4. All Clear Compatible State */}
          {!hasAnyDiagnostics && (
            <div
              data-testid="diagnostics-compatible-state"
              className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-3.5 text-emerald-800 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold">Tương thích chuẩn</div>
                <p className="text-xs leading-relaxed opacity-90">
                  Không phát hiện xung đột hay cảnh báo phần cứng giữa các linh kiện đã chọn.
                </p>
              </div>
            </div>
          )}

          {/* Missing Recommended Slots */}
          {(evaluation?.missing_recommended_slots?.length ?? 0) > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500">
                Khe cốt lõi còn thiếu:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {evaluation?.missing_recommended_slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onFocusSlot(slot)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-smart-blue border border-slate-200 text-[11px] font-semibold transition"
                  >
                    + {slot}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compact Build Summary */}
      {resolvedItems.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tóm tắt linh kiện ({resolvedItems.length})
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {resolvedItems.map((it) => (
              <div
                key={`${it.slot_code}-${it.product_id}`}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-slate-600 truncate">
                  <strong className="text-smart-navy">{it.slot_code}:</strong>{' '}
                  {it.name}
                  {it.quantity > 1 ? ` (×${it.quantity})` : ''}
                </span>
                {typeof it.price === 'number' && (
                  <span className="font-bold text-smart-navy flex-shrink-0 tabular-nums">
                    {formatVnd(it.price * it.quantity)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              Tổng tiền dự kiến
            </span>
            <span className="text-base font-black text-smart-blue tabular-nums">
              {formatVnd(displayTotalPrice)}
            </span>
          </div>
        </div>
      )}

      {/* AI Advisor CTA */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={handleAskAI}
          disabled={selectedItems.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-smart-navy to-smart-blue hover:from-slate-900 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold transition shadow-sm"
        >
          <Bot className="w-4 h-4 text-smart-cyan" />
          <span>Hỏi AI Tư vấn Cấu hình</span>
          <Sparkles className="w-3.5 h-3.5 text-smart-cyan" />
        </button>
      </div>
    </div>
  );
};
