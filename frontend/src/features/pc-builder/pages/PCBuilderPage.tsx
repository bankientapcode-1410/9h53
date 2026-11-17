import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import type {
  AllBuilderSlotCode,
  BuildItemInput,
  BuilderGateStatus,
  BuilderSlotCode,
  ValidatedCartItemDTO,
} from '@/features/pc-builder/types/builder.types';
import {
  CORE_SLOT_CODES,
  CORE_SLOT_CONFIGS,
  MAX_DISTINCT_BUILD_PRODUCTS,
  MAX_SLOT_QUANTITY,
  PERIPHERAL_SLOT_CODES,
  TOTAL_CORE_SLOTS,
} from '@/features/pc-builder/constants/slotConfig';
import { pcBuilderService } from '@/services/pcBuilderService';
import { useCartStore } from '@/stores/useCartStore';
import { usePCBuilderStore } from '@/stores/usePCBuilderStore';
import { BuilderBottomBar } from '@/features/pc-builder/components/BuilderBottomBar';
import { BuilderPrintSheetModal } from '@/features/pc-builder/components/BuilderPrintSheetModal';
import { BuilderSlotList } from '@/features/pc-builder/components/BuilderSlotList';
import { BuilderTelemetryBar } from '@/features/pc-builder/components/BuilderTelemetryBar';
import { ComponentPickerModal } from '@/features/pc-builder/components/ComponentPickerModal';
import { QuickFixPanel } from '@/features/pc-builder/components/QuickFixPanel';
import { RiskConfirmationModal } from '@/features/pc-builder/components/RiskConfirmationModal';
import {
  RuleDiagnosticsSidebar,
  type BuildItemDetailInput,
} from '@/features/pc-builder/components/RuleDiagnosticsSidebar';
import { SlotViolationBanner } from '@/features/pc-builder/components/SlotViolationBanner';

function parseShareItemsParam(rawItems: string): BuildItemInput[] {
  const merged = new Map<string, number>();
  const tokens = rawItems.split(',');

  for (const rawToken of tokens) {
    const token = rawToken.trim();
    if (!token) continue;

    const colonIdx = token.lastIndexOf(':');
    const rawId = colonIdx > 0 ? token.slice(0, colonIdx).trim() : token;
    const rawQty = colonIdx > 0 ? token.slice(colonIdx + 1).trim() : '1';

    let productId = rawId;
    try {
      productId = decodeURIComponent(rawId).trim();
    } catch {
      productId = rawId;
    }

    if (!productId || productId.length > 64) {
      continue;
    }

    const parsedQty = Number.parseInt(rawQty, 10);
    const clampedQty =
      Number.isFinite(parsedQty) && parsedQty > 0
        ? Math.min(MAX_SLOT_QUANTITY, parsedQty)
        : 1;

    if (!merged.has(productId) && merged.size >= MAX_DISTINCT_BUILD_PRODUCTS) {
      continue;
    }
    merged.set(
      productId,
      Math.min(MAX_SLOT_QUANTITY, (merged.get(productId) ?? 0) + clampedQty)
    );
  }

  const items: BuildItemInput[] = [];
  merged.forEach((quantity, product_id) => {
    items.push({ product_id, quantity });
  });
  return items;
}

export const PCBuilderPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    coreSlots,
    peripherals,
    evaluation,
    isEvaluating,
    highlightedSlotCode,
    acknowledgedWarnings,
    slotNotice,
    selectProduct,
    removeSlotProduct,
    updateSlotQuantity,
    loadFromResolved,
    clearBuild,
    setHighlightedSlot,
    setAcknowledgedWarnings,
    clearSlotNotice,
    getSelectedItemsInput,
    triggerEvaluate,
  } = usePCBuilderStore();

  const [activePickerSlot, setActivePickerSlot] =
    useState<AllBuilderSlotCode | null>(null);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [shareNotice, setShareNotice] = useState<{
    tone: 'success' | 'warning';
    message: string;
  } | null>(null);
  const [gateFeedback, setGateFeedback] = useState<{
    tone: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const selectedItems = useMemo(
    () => getSelectedItemsInput(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coreSlots, peripherals]
  );

  const selectedCoreCount = useMemo(
    () =>
      CORE_SLOT_CONFIGS.filter(
        (cfg) =>
          cfg.is_core &&
          (coreSlots[cfg.slot_code as BuilderSlotCode]?.length ?? 0) > 0
      ).length,
    [coreSlots]
  );

  const localTotalPrice = useMemo(() => {
    let total = 0;
    for (const code of CORE_SLOT_CODES) {
      for (const item of coreSlots[code] || []) {
        total += item.product.price * item.quantity;
      }
    }
    for (const code of PERIPHERAL_SLOT_CODES) {
      for (const item of peripherals[code] || []) {
        total += item.product.price * item.quantity;
      }
    }
    return total;
  }, [coreSlots, peripherals]);

  const rawItemsParam = searchParams.get('items');

  // Evaluate persisted configuration on initial mount when no Share URL ?items= param is present
  useEffect(() => {
    if (!searchParams.get('items') && selectedItems.length > 0 && !evaluation) {
      void triggerEvaluate({ immediate: true });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve Share URL ?items=productId:qty,... into Builder slots + evaluation
  useEffect(() => {
    if (!rawItemsParam || !rawItemsParam.trim()) {
      return;
    }

    const parsedItems = parseShareItemsParam(rawItemsParam);
    const clearShareQueryParam = () => {
      const nextParams = new URLSearchParams(searchParams);
      if (nextParams.has('items')) {
        nextParams.delete('items');
        setSearchParams(nextParams, { replace: true });
      }
    };

    if (parsedItems.length === 0) {
      setShareNotice({
        tone: 'warning',
        message: 'Liên kết chia sẻ cấu hình không hợp lệ hoặc không chứa linh kiện nào.',
      });
      clearShareQueryParam();
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();
    setGateFeedback(null);

    void pcBuilderService
      .resolveShareBuild({ items: parsedItems }, controller.signal)
      .then((response) => {
        if (isCancelled) return;
        const {
          resolved_items,
          dropped_product_ids,
          evaluation: resolvedEvaluation,
        } = response.data;

        loadFromResolved(resolved_items, resolvedEvaluation);

        if (dropped_product_ids.length > 0) {
          setShareNotice({
            tone: 'warning',
            message:
              resolved_items.length > 0
                ? `Một số linh kiện (${dropped_product_ids.length} mã: ${dropped_product_ids.join(', ')}) đã hết hàng hoặc ngừng kinh doanh và đã được gỡ khỏi cấu hình.`
                : `Tất cả linh kiện trong liên kết chia sẻ (${dropped_product_ids.join(', ')}) đã hết hàng hoặc ngừng kinh doanh.`,
          });
        } else if (resolved_items.length > 0) {
          setShareNotice({
            tone: 'success',
            message: `Đã khôi phục ${resolved_items.length} linh kiện từ liên kết chia sẻ cấu hình.`,
          });
        }

        clearShareQueryParam();
      })
      .catch((err) => {
        if (isCancelled || axios.isCancel(err)) return;
        setShareNotice({
          tone: 'warning',
          message: 'Không thể khôi phục cấu hình từ liên kết chia sẻ. Vui lòng thử lại.',
        });
        clearShareQueryParam();
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawItemsParam]);

  // Scroll & clear highlight after 1500ms when highlightedSlotCode changes (hooked by Wave 3)
  useEffect(() => {
    if (!highlightedSlotCode) return;
    const el = document.getElementById(`builder-slot-${highlightedSlotCode}`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timer = setTimeout(() => {
      setHighlightedSlot(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [highlightedSlotCode, setHighlightedSlot]);

  const selectedItemsDetails = useMemo<BuildItemDetailInput[]>(() => {
    const details: BuildItemDetailInput[] = [];
    for (const code of CORE_SLOT_CODES) {
      for (const item of coreSlots[code] || []) {
        details.push({
          slot_code: code,
          product_id: item.product.product_id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        });
      }
    }
    for (const code of PERIPHERAL_SLOT_CODES) {
      for (const item of peripherals[code] || []) {
        details.push({
          slot_code: code,
          product_id: item.product.product_id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        });
      }
    }
    return details;
  }, [coreSlots, peripherals]);

  const handleFocusSlot = useCallback(
    (slotCode: string) => {
      if (slotCode === 'SLOT_LIST') {
        const listEl = document.getElementById('builder-slot-list');
        if (listEl && typeof listEl.scrollIntoView === 'function') {
          listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
      if (highlightedSlotCode === slotCode) {
        const el = document.getElementById(`builder-slot-${slotCode}`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      setHighlightedSlot(slotCode);
    },
    [highlightedSlotCode, setHighlightedSlot]
  );

  const displayTotalPrice =
    evaluation?.telemetry?.total_price ?? localTotalPrice;

  const totalItemsCount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  );

  const effectiveGateStatus: BuilderGateStatus = useMemo(() => {
    if (selectedItems.length === 0) {
      return 'BLOCKED_EMPTY';
    }
    return evaluation?.gate_status ?? 'BLOCKED_EMPTY';
  }, [selectedItems.length, evaluation?.gate_status]);

  const warnings = evaluation?.compatibility?.warnings ?? [];
  const errorCount = evaluation?.compatibility?.errors?.length ?? 0;
  const warningCount = warnings.length;
  const stockIssuesCount = evaluation?.stock_issues?.length ?? 0;

  useEffect(() => {
    setGateFeedback(null);
    if (effectiveGateStatus !== 'WARNING_CONFIRM_REQUIRED') {
      setIsRiskModalOpen(false);
    }
  }, [selectedItems, effectiveGateStatus]);

  const handleAddToCartGate = useCallback(
    async (acknowledgedFromModal = false) => {
      if (
        selectedItems.length === 0 ||
        effectiveGateStatus === 'BLOCKED_EMPTY' ||
        effectiveGateStatus === 'BLOCKED_OUT_OF_STOCK' ||
        effectiveGateStatus === 'BLOCKED_COMPATIBILITY_ERROR'
      ) {
        return;
      }

      const isAck = acknowledgedFromModal || acknowledgedWarnings;
      if (effectiveGateStatus === 'WARNING_CONFIRM_REQUIRED' && !isAck) {
        setIsRiskModalOpen(true);
        return;
      }

      setIsSubmittingCart(true);
      setGateFeedback(null);
      try {
        const response = await pcBuilderService.addBuildToCart({
          items: selectedItems,
          acknowledged_warnings: isAck,
        });
        const cartItems = response.data.items || [];
        useCartStore.getState().addBuildBundle(cartItems);
        const totalQtyAdded = cartItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        setGateFeedback({
          tone: 'success',
          message:
            effectiveGateStatus === 'WARNING_CONFIRM_REQUIRED'
              ? `Đã xác nhận rủi ro kỹ thuật (WARNING) và thêm ${totalQtyAdded} sản phẩm vào giỏ hàng.`
              : `Đã thêm trọn bộ cấu hình (${totalQtyAdded} sản phẩm) đạt chuẩn an toàn vào giỏ hàng.`,
        });
        setIsRiskModalOpen(false);
      } catch (error) {
        const offlineErr = error as {
          isOfflineFallback?: boolean;
          isOfflineUnavailable?: boolean;
        };
        const canUseVerifiedLocalState =
          Boolean(
            offlineErr?.isOfflineFallback && offlineErr?.isOfflineUnavailable
          ) && Boolean(evaluation && !evaluation.is_offline_mock);

        if (canUseVerifiedLocalState && evaluation) {
          const localItems: ValidatedCartItemDTO[] = [];
          for (const code of CORE_SLOT_CODES) {
            for (const item of coreSlots[code] || []) {
              const unitPrice = item.product.price;
              localItems.push({
                product_id: item.product.product_id,
                name: item.product.name,
                slot_code: code,
                category_code: item.product.category_code || code,
                image_url: item.product.image_url || '',
                unit_price: unitPrice,
                quantity: item.quantity,
                line_total: unitPrice * item.quantity,
                available_stock: item.product.in_stock
                  ? Math.max(10, item.quantity)
                  : 0,
              });
            }
          }
          for (const code of PERIPHERAL_SLOT_CODES) {
            for (const item of peripherals[code] || []) {
              const unitPrice = item.product.price;
              localItems.push({
                product_id: item.product.product_id,
                name: item.product.name,
                slot_code: code,
                category_code: item.product.category_code || code,
                image_url: item.product.image_url || '',
                unit_price: unitPrice,
                quantity: item.quantity,
                line_total: unitPrice * item.quantity,
                available_stock: item.product.in_stock
                  ? Math.max(10, item.quantity)
                  : 0,
              });
            }
          }

          const allInStock =
            localItems.length > 0 &&
            localItems.every((it) => it.available_stock >= it.quantity);
          const gatePermits =
            evaluation.gate_status === 'READY_SAFE' ||
            (evaluation.gate_status === 'WARNING_CONFIRM_REQUIRED' && isAck);

          if (allInStock && gatePermits) {
            useCartStore.getState().addBuildBundle(localItems);
            const totalQtyAdded = localItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            setGateFeedback({
              tone: 'success',
              message:
                evaluation.gate_status === 'WARNING_CONFIRM_REQUIRED'
                  ? `Đã xác nhận rủi ro kỹ thuật (WARNING) và thêm ${totalQtyAdded} sản phẩm vào giỏ hàng.`
                  : `Đã thêm trọn bộ cấu hình (${totalQtyAdded} sản phẩm) đạt chuẩn an toàn vào giỏ hàng.`,
            });
            setIsRiskModalOpen(false);
            return;
          }
        }

        if (axios.isAxiosError(error) && error.response?.status === 409) {
          const payload = error.response.data as
            | { error_code?: string; message?: string }
            | undefined;
          setAcknowledgedWarnings(false);
          if (
            payload?.error_code === 'BUILDER_COMPATIBILITY_CONFLICT' ||
            payload?.error_code === 'PROD_OUT_OF_STOCK' ||
            payload?.error_code === 'BUILDER_PRODUCT_UNAVAILABLE' ||
            payload?.error_code === 'BUILDER_WARNING_ACK_REQUIRED'
          ) {
            void triggerEvaluate({ immediate: true });
          }
          setIsRiskModalOpen(false);
          setGateFeedback({
            tone: 'error',
            message:
              payload?.message ||
              'Tồn kho hoặc tương thích vừa thay đổi trên máy chủ. Đang cập nhật lại cấu hình mới nhất.',
          });
        } else {
          setGateFeedback({
            tone: 'error',
            message:
              'Không thể xử lý yêu cầu thêm cấu hình vào giỏ hàng. Vui lòng thử lại.',
          });
        }
      } finally {
        setIsSubmittingCart(false);
      }
    },
    [
      selectedItems,
      effectiveGateStatus,
      acknowledgedWarnings,
      evaluation,
      coreSlots,
      peripherals,
      setAcknowledgedWarnings,
      triggerEvaluate,
    ]
  );

  const handleConfirmRiskModal = useCallback(async () => {
    setAcknowledgedWarnings(true);
    await handleAddToCartGate(true);
  }, [setAcknowledgedWarnings, handleAddToCartGate]);

  const handleShareBuild = useCallback(async () => {
    if (selectedItems.length === 0) {
      setShareNotice({
        tone: 'warning',
        message: 'Vui lòng chọn ít nhất một linh kiện trước khi tạo liên kết chia sẻ.',
      });
      return;
    }

    const encodedItems = selectedItems
      .map((item) => `${encodeURIComponent(item.product_id)}:${item.quantity}`)
      .join(',');
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : '';
    const shareUrl = `${origin}/builder?items=${encodedItems}`;

    let copied = false;
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    setShareNotice({
      tone: 'success',
      message: copied
        ? `Đã sao chép liên kết chia sẻ cấu hình (${selectedItems.length} linh kiện) vào bộ nhớ tạm!`
        : `Liên kết chia sẻ cấu hình: ${shareUrl}`,
    });
  }, [selectedItems]);

  return (
    <div className="bg-smart-bg min-h-[calc(100vh-11rem)] py-6 pb-24">
      <div className="max-w-7xl mx-auto px-4 space-y-5">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-smart-blue flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-smart-navy tracking-tight">
                  Xây dựng cấu hình PC
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Rule Engine Real-time
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Chọn từng linh kiện theo khe cắm chuẩn — hệ thống tự động kiểm tra tương thích & ước lượng công suất nguồn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() => clearBuild()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-slate-700 hover:text-smart-red border border-slate-200 hover:border-red-200 text-xs font-bold transition shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm mới cấu hình</span>
              </button>
            )}
          </div>
        </div>

        {/* Notice Toast / Banner for slot quantity or distinct cap limits */}
        {slotNotice && (
          <div className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 flex items-center justify-between gap-3 text-xs font-semibold text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{slotNotice}</span>
            </div>
            <button
              type="button"
              onClick={clearSlotNotice}
              className="text-amber-700 hover:text-amber-900 font-bold"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Notice Banner for Share URL Restore / Copy */}
        {shareNotice && (
          <div
            data-testid="builder-share-notice"
            className={`rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs font-semibold border ${
              shareNotice.tone === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {shareNotice.tone === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              )}
              <span>{shareNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setShareNotice(null)}
              className="font-bold underline-offset-2 hover:underline flex-shrink-0"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Wave 3A: BuilderTelemetryBar */}
        <div data-testid="builder-telemetry-region">
          <BuilderTelemetryBar
            telemetry={evaluation?.telemetry}
            compatibility={evaluation?.compatibility}
            isEvaluating={isEvaluating}
            isOfflineMock={Boolean(evaluation?.is_offline_mock)}
            localTotalPrice={localTotalPrice}
            selectedCoreSlotsFallback={selectedCoreCount}
            totalCoreSlotsFallback={TOTAL_CORE_SLOTS}
          />
        </div>

        {/* Main 2-Column Builder Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 8 Core Slots + Collapsible Peripherals */}
          <div className="lg:col-span-8">
            <BuilderSlotList
              coreSlots={coreSlots}
              peripherals={peripherals}
              slotStatuses={evaluation?.slot_statuses}
              highlightedSlotCode={highlightedSlotCode}
              onOpenPicker={(slotCode) => setActivePickerSlot(slotCode)}
              onRemoveItem={(slotCode, productId) =>
                removeSlotProduct(slotCode, productId)
              }
              onUpdateQuantity={(slotCode, productId, delta) =>
                updateSlotQuantity(slotCode, productId, delta)
              }
              renderSlotBanner={(slotCode, diagnostic) => (
                <SlotViolationBanner
                  slotCode={slotCode}
                  diagnostic={diagnostic}
                  errors={evaluation?.compatibility?.errors ?? []}
                  warnings={evaluation?.compatibility?.warnings ?? []}
                  info={evaluation?.compatibility?.info ?? []}
                  renderQuickFix={(violation) => (
                    <QuickFixPanel
                      violation={violation}
                      sourceSlotCode={slotCode}
                    />
                  )}
                  onViewAllInSidebar={() => {
                    const sidebarEl = document.getElementById(
                      'builder-diagnostics-sidebar'
                    );
                    if (
                      sidebarEl &&
                      typeof sidebarEl.scrollIntoView === 'function'
                    ) {
                      sidebarEl.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                      });
                    }
                  }}
                />
              )}
            />
          </div>

          {/* Right Column: Wave 3A RuleDiagnosticsSidebar */}
          <aside
            data-testid="builder-diagnostics-sidebar-region"
            className="lg:col-span-4 lg:sticky lg:top-28 space-y-4"
          >
            <RuleDiagnosticsSidebar
              evaluation={evaluation}
              selectedItems={selectedItems}
              selectedItemsDetails={selectedItemsDetails}
              isEvaluating={isEvaluating}
              onFocusSlot={handleFocusSlot}
            />
          </aside>
        </div>

        {/* Wave 4: BuilderBottomBar (Risk Gatekeeper & Cart/Share/Print actions) */}
        <div data-testid="builder-bottom-bar-region" className="pt-2 space-y-3">
          {gateFeedback && (
            <div
              data-testid="builder-gate-feedback"
              role="status"
              className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 text-xs font-semibold ${
                gateFeedback.tone === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : gateFeedback.tone === 'warning'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-red-50 border-red-200 text-smart-red'
              }`}
            >
              <div className="flex items-center gap-2">
                {gateFeedback.tone === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : gateFeedback.tone === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-smart-red flex-shrink-0" />
                )}
                <span>{gateFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setGateFeedback(null)}
                className="font-bold opacity-80 hover:opacity-100"
              >
                Đóng
              </button>
            </div>
          )}

          <BuilderBottomBar
            gateStatus={effectiveGateStatus}
            totalPrice={displayTotalPrice}
            selectedCoreSlots={selectedCoreCount}
            totalCoreSlots={TOTAL_CORE_SLOTS}
            totalItemsCount={totalItemsCount}
            errorCount={errorCount}
            warningCount={warningCount}
            stockIssuesCount={stockIssuesCount}
            isEvaluating={isEvaluating}
            isSubmitting={isSubmittingCart}
            onOpenRiskModal={() => setIsRiskModalOpen(true)}
            onAddToCart={() => void handleAddToCartGate(false)}
            onShareBuild={() => void handleShareBuild()}
            onPrintQuote={() => setIsPrintModalOpen(true)}
          />
        </div>
      </div>

      {/* Component Picker Modal */}
      <ComponentPickerModal
        isOpen={activePickerSlot !== null}
        slotCode={activePickerSlot}
        currentItems={selectedItems}
        onSelectProduct={(slotCode, product) => selectProduct(slotCode, product)}
        onClose={() => setActivePickerSlot(null)}
      />

      {/* Wave 4: Risk Confirmation Modal for WARNING_CONFIRM_REQUIRED */}
      <RiskConfirmationModal
        isOpen={isRiskModalOpen}
        warnings={warnings}
        totalPrice={displayTotalPrice}
        isSubmitting={isSubmittingCart}
        onConfirm={handleConfirmRiskModal}
        onCancel={() => setIsRiskModalOpen(false)}
      />

      {/* Wave 5: Print A4 Spec Sheet Modal */}
      <BuilderPrintSheetModal
        isOpen={isPrintModalOpen}
        coreSlots={coreSlots}
        peripherals={peripherals}
        evaluation={evaluation}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
