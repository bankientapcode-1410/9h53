import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  Loader2,
  RefreshCw,
  Sparkles,
  Wrench,
} from 'lucide-react';
import type {
  CompatibilityViolation,
  QuickFixOptionDTO,
  QuickFixResponse,
  QuickFixStrategyGroupDTO,
} from '@/features/pc-builder/types/builder.types';
import { isBuilderSlotCode } from '@/features/pc-builder/constants/slotConfig';
import type { ProductSummaryDTO } from '@/features/product-catalog/types/product.types';
import { pcBuilderService } from '@/services/pcBuilderService';
import { usePCBuilderStore } from '@/stores/usePCBuilderStore';
import { getProductImageFallback } from '@/utils/productImageFallback';

export interface QuickFixPanelProps {
  /** Thông tin vi phạm từ RuleDiagnostics / SlotViolationBanner */
  violation?: CompatibilityViolation;
  /** Mã quy tắc cần mô phỏng thay thế (override violation.rule_id nếu cần) */
  targetRuleId?: string;
  /** Mã khe ưu tiên gợi ý thay thế trước */
  sourceSlotCode?: string;
  /** Mã sản phẩm nguồn của vi phạm */
  sourceProductId?: string | null;
  /** Mã sản phẩm đích của vi phạm */
  targetProductId?: string | null;
  /** Tự động tải gợi ý ngay khi render mà không chờ click nút */
  autoLoad?: boolean;
  /** Số lượng phương án tối đa mỗi chiến lược (1..5, mặc định 3) */
  limitPerStrategy?: number;
  /** Callback tùy chỉnh khi user chọn "Áp dụng ngay"; mặc định cập nhật trực tiếp usePCBuilderStore */
  onSelectReplacement?: (
    slotCode: string,
    oldProductId: string,
    newProduct: ProductSummaryDTO
  ) => void;
}

const formatVnd = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;

const formatPriceDelta = (delta: number): { text: string; toneClass: string } => {
  if (delta > 0) {
    return {
      text: `+${formatVnd(delta)}`,
      toneClass: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  if (delta < 0) {
    return {
      text: `-${formatVnd(Math.abs(delta))}`,
      toneClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  return {
    text: 'Bằng giá',
    toneClass: 'bg-slate-100 text-slate-600 border-slate-200',
  };
};

export const QuickFixPanel: React.FC<QuickFixPanelProps> = ({
  violation,
  targetRuleId,
  sourceSlotCode,
  sourceProductId,
  targetProductId,
  autoLoad = false,
  limitPerStrategy = 3,
  onSelectReplacement,
}) => {
  const effectiveRuleId = (targetRuleId || violation?.rule_id || '').trim();
  const effectiveSourceId =
    sourceProductId !== undefined ? sourceProductId : (violation?.source_product?.id ?? null);
  const effectiveTargetId =
    targetProductId !== undefined ? targetProductId : (violation?.target_product?.id ?? null);
  const preferredSlot = sourceSlotCode?.trim().toUpperCase() || null;

  const [isExpanded, setIsExpanded] = useState(Boolean(autoLoad));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<QuickFixResponse | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const cancelInFlight = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!effectiveRuleId) {
      return;
    }

    cancelInFlight();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsExpanded(true);
    setIsLoading(true);
    setErrorMsg(null);

    const currentItems = usePCBuilderStore.getState().getSelectedItemsInput();

    try {
      const response = await pcBuilderService.getQuickFix(
        {
          current_items: currentItems,
          violation_rule_id: effectiveRuleId,
          source_product_id: effectiveSourceId,
          target_product_id: effectiveTargetId,
          preferred_replace_slot: preferredSlot,
          limit_per_strategy: limitPerStrategy,
        },
        controller.signal
      );

      if (controller.signal.aborted) {
        return;
      }

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setResult(null);
        setErrorMsg(response.message || 'Không thể tạo gợi ý sửa lỗi.');
      }
    } catch (err) {
      const errObj = err as { code?: string; name?: string } | null;
      if (errObj?.code === 'ERR_CANCELED' || errObj?.name === 'AbortError') {
        return;
      }
      setResult(null);
      setErrorMsg('Đã xảy ra lỗi khi mô phỏng linh kiện thay thế.');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [
    cancelInFlight,
    effectiveRuleId,
    effectiveSourceId,
    effectiveTargetId,
    limitPerStrategy,
    preferredSlot,
  ]);

  useEffect(() => {
    setResult(null);
    setErrorMsg(null);
    if (autoLoad && effectiveRuleId) {
      void fetchSuggestions();
    } else {
      setIsExpanded(false);
    }
    return () => {
      cancelInFlight();
    };
  }, [autoLoad, cancelInFlight, effectiveRuleId, fetchSuggestions]);

  if (!effectiveRuleId) {
    return null;
  }

  // Chỉ hiển thị QuickFix cho lỗi nghiêm trọng (ERROR) hoặc cảnh báo (WARNING)
  if (!targetRuleId && violation?.severity === 'INFO') {
    return null;
  }

  const handleApplyOption = (
    group: QuickFixStrategyGroupDTO,
    option: QuickFixOptionDTO
  ) => {
    if (onSelectReplacement) {
      onSelectReplacement(group.replace_slot, group.current_product_id, option.product);
      setIsExpanded(false);
      return;
    }

    const normalizedSlot = group.replace_slot.trim().toUpperCase();
    if (!isBuilderSlotCode(normalizedSlot)) {
      return;
    }

    const store = usePCBuilderStore.getState();
    if (group.current_product_id) {
      store.replaceSlotProduct(normalizedSlot, group.current_product_id, option.product);
    } else {
      store.selectProduct(normalizedSlot, option.product);
    }
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div data-testid={`quickfix-panel-${effectiveRuleId}`}>
        <button
          type="button"
          onClick={() => void fetchSuggestions()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-smart-blue border border-blue-200 text-[11px] font-extrabold transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gợi ý sửa lỗi</span>
        </button>
      </div>
    );
  }

  const strategies = result?.strategies ?? [];

  return (
    <div
      data-testid={`quickfix-panel-${effectiveRuleId}`}
      className="mt-2 rounded-xl bg-white border border-blue-200 shadow-sm p-3 space-y-3 text-slate-800"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-smart-blue" />
          <span className="text-xs font-extrabold text-smart-navy">
            Gợi ý thay thế tương thích
          </span>
          {result && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {result.evaluation_time_ms}ms
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            cancelInFlight();
            setIsExpanded(false);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-smart-navy transition"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>Thu gọn</span>
        </button>
      </div>

      {/* Body States */}
      {isLoading ? (
        <div className="py-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 text-smart-blue animate-spin" />
          <span>Đang mô phỏng phương án tương thích...</span>
        </div>
      ) : errorMsg ? (
        <div className="py-2 flex items-center justify-between gap-2 text-xs text-red-700">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => void fetchSuggestions()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 font-bold text-[11px]"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : strategies.length === 0 ? (
        <p className="text-xs text-slate-600 leading-relaxed py-1">
          {result?.guidance_message ||
            'Không tìm thấy linh kiện thay thế khả dụng trong kho cho xung đột này.'}
        </p>
      ) : (
        <div className="space-y-3">
          {strategies.map((group) => (
            <div
              key={`${group.replace_slot}-${group.current_product_id}`}
              data-testid={`quickfix-strategy-${group.replace_slot}`}
              className="space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-smart-blue">
                  {group.strategy_label}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Khe: {group.replace_slot}
                </span>
              </div>

              <div className="space-y-2">
                {group.options.map((option) => {
                  const deltaBadge = formatPriceDelta(option.price_delta);
                  const specEntries = Object.entries(option.product.key_specs || {}).slice(0, 3);

                  return (
                    <div
                      key={option.product.product_id}
                      data-testid={`quickfix-option-${option.product.product_id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-smart-blue/50 transition"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img
                            src={
                              option.product.image_url ||
                              getProductImageFallback(option.product.category_code)
                            }
                            alt={option.product.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getProductImageFallback(
                                option.product.category_code
                              );
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                              {option.product.brand}
                            </span>

                            {option.resulting_status === 'WARNING' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Còn {option.remaining_warnings_count} cảnh báo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Tương thích 0 lỗi
                              </span>
                            )}

                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${deltaBadge.toneClass}`}
                            >
                              {deltaBadge.text}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-800 line-clamp-1">
                            {option.product.name}
                          </div>

                          {specEntries.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {specEntries.map(([k, v]) => (
                                <span
                                  key={k}
                                  className="text-[10px] font-medium bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  {Array.isArray(v) ? v.join(', ') : String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                        <div className="text-xs font-black text-smart-blue">
                          {formatVnd(option.product.price)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyOption(group, option)}
                          className="px-3 py-1.5 rounded-lg bg-smart-blue hover:bg-blue-700 text-white text-[11px] font-extrabold transition shadow-sm active:scale-95 whitespace-nowrap"
                        >
                          Áp dụng ngay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
