import axios from 'axios';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ProductSummaryDTO } from '@/features/product-catalog/types/product.types';
import type {
  AllBuilderSlotCode,
  BuildItemInput,
  BuilderSlotCode,
  PCBuilderEvaluateResponse,
  PeripheralSlotCode,
  SelectedSlotItem,
} from '@/features/pc-builder/types/builder.types';
import {
  ALL_SLOT_CONFIG_MAP,
  CORE_SLOT_CODES,
  MAX_DISTINCT_BUILD_PRODUCTS,
  MAX_SLOT_QUANTITY,
  PERIPHERAL_SLOT_CODES,
  createEmptyCoreSlots,
  createEmptyPeripherals,
  isCoreSlotCode,
  isPeripheralSlotCode,
} from '@/features/pc-builder/constants/slotConfig';
import { pcBuilderService } from '@/services/pcBuilderService';

export const PC_BUILDER_STORAGE_KEY = 'smartpc_builder_v1';
export const EVALUATE_DEBOUNCE_MS = 150;

let evaluateDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeAbortController: AbortController | null = null;

function clearPendingDebounce() {
  if (evaluateDebounceTimer !== null) {
    clearTimeout(evaluateDebounceTimer);
    evaluateDebounceTimer = null;
  }
}

function abortInFlightEvaluation() {
  if (activeAbortController !== null) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}

function collectDistinctProductIds(
  coreSlots: Record<BuilderSlotCode, SelectedSlotItem[]>,
  peripherals: Record<PeripheralSlotCode, SelectedSlotItem[]>,
  excludeSlot?: AllBuilderSlotCode
): Set<string> {
  const ids = new Set<string>();
  for (const code of CORE_SLOT_CODES) {
    if (excludeSlot === code) continue;
    for (const item of coreSlots[code] || []) {
      if (item?.product?.product_id) {
        ids.add(item.product.product_id);
      }
    }
  }
  for (const code of PERIPHERAL_SLOT_CODES) {
    if (excludeSlot === code) continue;
    for (const item of peripherals[code] || []) {
      if (item?.product?.product_id) {
        ids.add(item.product.product_id);
      }
    }
  }
  return ids;
}

function isAbortError(error: unknown): boolean {
  if (axios.isCancel(error)) return true;
  const errObj = error as { code?: string; name?: string } | null;
  return errObj?.code === 'ERR_CANCELED' || errObj?.name === 'AbortError';
}

export interface ResolvedBuilderSlotItem {
  slot_code: string;
  quantity: number;
  product: ProductSummaryDTO;
}

export interface PCBuilderStoreState {
  coreSlots: Record<BuilderSlotCode, SelectedSlotItem[]>;
  peripherals: Record<PeripheralSlotCode, SelectedSlotItem[]>;
  evaluation: PCBuilderEvaluateResponse | null;
  isEvaluating: boolean;
  evaluationSeq: number;
  highlightedSlotCode: string | null;
  acknowledgedWarnings: boolean;
  slotNotice: string | null;

  selectProduct: (slotCode: AllBuilderSlotCode, product: ProductSummaryDTO) => void;
  removeSlotProduct: (slotCode: AllBuilderSlotCode, productId: string) => void;
  removeItem: (slotCode: AllBuilderSlotCode, productId: string) => void;
  updateSlotQuantity: (slotCode: AllBuilderSlotCode, productId: string, delta: number) => void;
  updateQuantity: (slotCode: AllBuilderSlotCode, productId: string, delta: number) => void;
  replaceSlotProduct: (
    slotCode: AllBuilderSlotCode,
    oldProductId: string,
    newProduct: ProductSummaryDTO
  ) => void;
  loadFromResolved: (
    resolvedItems: ResolvedBuilderSlotItem[],
    evaluation?: PCBuilderEvaluateResponse | null
  ) => void;
  clearBuild: () => void;
  setEvaluation: (evaluation: PCBuilderEvaluateResponse | null) => void;
  setHighlightedSlot: (slotCode: string | null) => void;
  setAcknowledgedWarnings: (acknowledged: boolean) => void;
  setWarningsAcknowledged: (acknowledged: boolean) => void;
  clearSlotNotice: () => void;
  getSelectedItemsInput: () => BuildItemInput[];
  triggerEvaluate: (options?: { immediate?: boolean }) => Promise<void> | void;
}

export const usePCBuilderStore = create<PCBuilderStoreState>()(
  persist(
    (set, get) => {
      const executeEvaluate = async () => {
        const items = get().getSelectedItemsInput();
        abortInFlightEvaluation();

        const nextSeq = get().evaluationSeq + 1;
        if (items.length === 0) {
          set({
            evaluationSeq: nextSeq,
            evaluation: null,
            isEvaluating: false,
          });
          return;
        }

        const controller = new AbortController();
        activeAbortController = controller;
        set({
          evaluationSeq: nextSeq,
          isEvaluating: true,
        });

        try {
          const response = await pcBuilderService.evaluateBuild(
            { items },
            controller.signal
          );
          if (nextSeq !== get().evaluationSeq) {
            return;
          }
          if (response.success && response.data) {
            set({
              evaluation: response.data,
              isEvaluating: false,
            });
          } else {
            set({ isEvaluating: false });
          }
        } catch (error) {
          if (nextSeq !== get().evaluationSeq) {
            return;
          }
          if (!isAbortError(error)) {
            set({ isEvaluating: false });
          }
        } finally {
          if (activeAbortController === controller) {
            activeAbortController = null;
          }
        }
      };

      return {
        coreSlots: createEmptyCoreSlots(),
        peripherals: createEmptyPeripherals(),
        evaluation: null,
        isEvaluating: false,
        evaluationSeq: 0,
        highlightedSlotCode: null,
        acknowledgedWarnings: false,
        slotNotice: null,

        selectProduct: (slotCode, product) => {
          const slotMeta = ALL_SLOT_CONFIG_MAP[slotCode];
          if (!slotMeta || !product?.product_id) return;

          const { coreSlots, peripherals } = get();
          const isCore = isCoreSlotCode(slotCode);
          const currentItems = isCore
            ? coreSlots[slotCode] || []
            : isPeripheralSlotCode(slotCode)
              ? peripherals[slotCode] || []
              : [];

          let nextItems: SelectedSlotItem[];

          if (slotMeta.selection_mode === 'SINGLE') {
            const distinctOtherIds = collectDistinctProductIds(
              coreSlots,
              peripherals,
              slotCode
            );
            if (
              !distinctOtherIds.has(product.product_id) &&
              distinctOtherIds.size >= MAX_DISTINCT_BUILD_PRODUCTS
            ) {
              set({
                slotNotice: `Cấu hình chỉ hỗ trợ tối đa ${MAX_DISTINCT_BUILD_PRODUCTS} linh kiện khác nhau.`,
              });
              return;
            }
            nextItems = [{ product, quantity: 1 }];
          } else {
            const currentSlotTotal = currentItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            if (currentSlotTotal >= slotMeta.max_total_qty) {
              set({
                slotNotice: `Khe ${slotMeta.short_name} đã đạt giới hạn tối đa ${slotMeta.max_total_qty} sản phẩm.`,
              });
              return;
            }

            const existingIdx = currentItems.findIndex(
              (item) => item.product.product_id === product.product_id
            );

            if (existingIdx >= 0) {
              nextItems = currentItems.map((item, idx) =>
                idx === existingIdx
                  ? { ...item, product, quantity: Math.min(MAX_SLOT_QUANTITY, item.quantity + 1) }
                  : item
              );
            } else {
              const distinctIds = collectDistinctProductIds(coreSlots, peripherals);
              if (
                !distinctIds.has(product.product_id) &&
                distinctIds.size >= MAX_DISTINCT_BUILD_PRODUCTS
              ) {
                set({
                  slotNotice: `Cấu hình chỉ hỗ trợ tối đa ${MAX_DISTINCT_BUILD_PRODUCTS} linh kiện khác nhau.`,
                });
                return;
              }
              nextItems = [...currentItems, { product, quantity: 1 }];
            }
          }

          if (isCore) {
            set({
              coreSlots: { ...coreSlots, [slotCode]: nextItems },
              acknowledgedWarnings: false,
              slotNotice: null,
            });
          } else if (isPeripheralSlotCode(slotCode)) {
            set({
              peripherals: { ...peripherals, [slotCode]: nextItems },
              acknowledgedWarnings: false,
              slotNotice: null,
            });
          }

          void get().triggerEvaluate();
        },

        removeSlotProduct: (slotCode, productId) => {
          const { coreSlots, peripherals } = get();
          if (isCoreSlotCode(slotCode)) {
            const nextItems = (coreSlots[slotCode] || []).filter(
              (item) => item.product.product_id !== productId
            );
            set({
              coreSlots: { ...coreSlots, [slotCode]: nextItems },
              acknowledgedWarnings: false,
              slotNotice: null,
            });
            void get().triggerEvaluate();
          } else if (isPeripheralSlotCode(slotCode)) {
            const nextItems = (peripherals[slotCode] || []).filter(
              (item) => item.product.product_id !== productId
            );
            set({
              peripherals: { ...peripherals, [slotCode]: nextItems },
              acknowledgedWarnings: false,
              slotNotice: null,
            });
            void get().triggerEvaluate();
          }
        },

        removeItem: (slotCode, productId) => {
          get().removeSlotProduct(slotCode, productId);
        },

        updateSlotQuantity: (slotCode, productId, delta) => {
          const slotMeta = ALL_SLOT_CONFIG_MAP[slotCode];
          if (!slotMeta || !delta) return;

          // Chỉ cho phép thay đổi số lượng trên slot MULTI hoặc thiết bị ngoại vi
          if (slotMeta.selection_mode === 'SINGLE' && slotMeta.is_core) {
            return;
          }

          const { coreSlots, peripherals } = get();
          const isCore = isCoreSlotCode(slotCode);
          const currentItems = isCore
            ? coreSlots[slotCode] || []
            : isPeripheralSlotCode(slotCode)
              ? peripherals[slotCode] || []
              : [];

          const target = currentItems.find(
            (item) => item.product.product_id === productId
          );
          if (!target) return;

          const otherSlotQty = currentItems.reduce(
            (sum, item) =>
              item.product.product_id === productId ? sum : sum + item.quantity,
            0
          );
          const rawNext = target.quantity + delta;

          let nextItems: SelectedSlotItem[];
          if (rawNext <= 0) {
            nextItems = currentItems.filter(
              (item) => item.product.product_id !== productId
            );
          } else {
            const maxAllowedForItem = Math.max(
              1,
              Math.min(MAX_SLOT_QUANTITY, slotMeta.max_total_qty - otherSlotQty)
            );
            const clampedQty = Math.min(rawNext, maxAllowedForItem);
            if (clampedQty === target.quantity) {
              set({
                slotNotice: `Tổng số lượng khe ${slotMeta.short_name} không thể vượt quá ${slotMeta.max_total_qty}.`,
              });
              return;
            }
            nextItems = currentItems.map((item) =>
              item.product.product_id === productId
                ? { ...item, quantity: clampedQty }
                : item
            );
          }

          if (isCore) {
            set({
              coreSlots: { ...coreSlots, [slotCode]: nextItems },
              acknowledgedWarnings: false,
              slotNotice: null,
            });
          } else if (isPeripheralSlotCode(slotCode)) {
            set({
              peripherals: { ...peripherals, [slotCode]: nextItems },
              acknowledgedWarnings: false,
              slotNotice: null,
            });
          }

          void get().triggerEvaluate();
        },

        updateQuantity: (slotCode, productId, delta) => {
          get().updateSlotQuantity(slotCode, productId, delta);
        },

        replaceSlotProduct: (slotCode, oldProductId, newProduct) => {
          const slotMeta = ALL_SLOT_CONFIG_MAP[slotCode];
          if (!slotMeta || !newProduct?.product_id) return;

          const { coreSlots, peripherals } = get();
          const isCore = isCoreSlotCode(slotCode);
          const currentItems = isCore
            ? coreSlots[slotCode] || []
            : isPeripheralSlotCode(slotCode)
              ? peripherals[slotCode] || []
              : [];

          let nextItems: SelectedSlotItem[];
          if (slotMeta.selection_mode === 'SINGLE') {
            const distinctOtherIds = collectDistinctProductIds(
              coreSlots,
              peripherals,
              slotCode
            );
            if (
              !distinctOtherIds.has(newProduct.product_id) &&
              distinctOtherIds.size >= MAX_DISTINCT_BUILD_PRODUCTS
            ) {
              set({
                slotNotice: `Cấu hình chỉ hỗ trợ tối đa ${MAX_DISTINCT_BUILD_PRODUCTS} linh kiện khác nhau.`,
              });
              return;
            }
            nextItems = [{ product: newProduct, quantity: 1 }];
          } else {
            const oldItem = currentItems.find(
              (item) => item.product.product_id === oldProductId
            );
            const preserveQty = oldItem ? oldItem.quantity : 1;
            const withoutOld = currentItems.filter(
              (item) => item.product.product_id !== oldProductId
            );
            const existingNew = withoutOld.find(
              (item) => item.product.product_id === newProduct.product_id
            );

            if (existingNew) {
              const otherQty = withoutOld.reduce(
                (sum, item) =>
                  item.product.product_id === newProduct.product_id
                    ? sum
                    : sum + item.quantity,
                0
              );
              const mergedQty = Math.min(
                MAX_SLOT_QUANTITY,
                slotMeta.max_total_qty - otherQty,
                existingNew.quantity + preserveQty
              );
              nextItems = withoutOld.map((item) =>
                item.product.product_id === newProduct.product_id
                  ? { ...item, product: newProduct, quantity: Math.max(1, mergedQty) }
                  : item
              );
            } else {
              nextItems = [
                ...withoutOld,
                { product: newProduct, quantity: preserveQty },
              ];
            }
          }

          if (isCore) {
            set({
              coreSlots: { ...coreSlots, [slotCode]: nextItems },
              acknowledgedWarnings: false,
              slotNotice: null,
            });
          } else if (isPeripheralSlotCode(slotCode)) {
            set({
              peripherals: { ...peripherals, [slotCode]: nextItems },
              acknowledgedWarnings: false,
              slotNotice: null,
            });
          }

          void get().triggerEvaluate();
        },

        loadFromResolved: (resolvedItems, evaluation = null) => {
          clearPendingDebounce();
          abortInFlightEvaluation();
          const nextSeq = get().evaluationSeq + 1;

          const nextCoreSlots = createEmptyCoreSlots();
          const nextPeripherals = createEmptyPeripherals();
          const distinctIds = new Set<string>();

          for (const entry of resolvedItems || []) {
            if (!entry?.product?.product_id) continue;
            const rawSlot = (entry.slot_code || entry.product.category_code || '')
              .trim()
              .toUpperCase();
            if (!isCoreSlotCode(rawSlot) && !isPeripheralSlotCode(rawSlot)) {
              continue;
            }
            const slotMeta = ALL_SLOT_CONFIG_MAP[rawSlot as AllBuilderSlotCode];
            if (!slotMeta) continue;

            const productId = entry.product.product_id;
            const isNewDistinct = !distinctIds.has(productId);
            if (isNewDistinct && distinctIds.size >= MAX_DISTINCT_BUILD_PRODUCTS) {
              continue;
            }

            const requestedQty = Math.max(1, Math.floor(entry.quantity || 1));

            if (isCoreSlotCode(rawSlot)) {
              const current = nextCoreSlots[rawSlot];
              if (slotMeta.selection_mode === 'SINGLE') {
                if (current.length === 0) {
                  nextCoreSlots[rawSlot] = [{ product: entry.product, quantity: 1 }];
                  distinctIds.add(productId);
                }
              } else {
                const usedQty = current.reduce((sum, it) => sum + it.quantity, 0);
                const remaining = Math.max(0, slotMeta.max_total_qty - usedQty);
                if (remaining > 0) {
                  const clamped = Math.min(requestedQty, remaining, MAX_SLOT_QUANTITY);
                  const existingIdx = current.findIndex(
                    (it) => it.product.product_id === productId
                  );
                  if (existingIdx >= 0) {
                    const merged = Math.min(
                      MAX_SLOT_QUANTITY,
                      current[existingIdx].quantity + clamped
                    );
                    nextCoreSlots[rawSlot] = current.map((it, idx) =>
                      idx === existingIdx ? { ...it, quantity: merged } : it
                    );
                  } else {
                    nextCoreSlots[rawSlot] = [
                      ...current,
                      { product: entry.product, quantity: clamped },
                    ];
                    distinctIds.add(productId);
                  }
                }
              }
            } else if (isPeripheralSlotCode(rawSlot)) {
              const current = nextPeripherals[rawSlot];
              const usedQty = current.reduce((sum, it) => sum + it.quantity, 0);
              const remaining = Math.max(0, slotMeta.max_total_qty - usedQty);
              if (remaining > 0) {
                const clamped = Math.min(requestedQty, remaining, MAX_SLOT_QUANTITY);
                const existingIdx = current.findIndex(
                  (it) => it.product.product_id === productId
                );
                if (existingIdx >= 0) {
                  const merged = Math.min(
                    MAX_SLOT_QUANTITY,
                    current[existingIdx].quantity + clamped
                  );
                  nextPeripherals[rawSlot] = current.map((it, idx) =>
                    idx === existingIdx ? { ...it, quantity: merged } : it
                  );
                } else {
                  nextPeripherals[rawSlot] = [
                    ...current,
                    { product: entry.product, quantity: clamped },
                  ];
                  distinctIds.add(productId);
                }
              }
            }
          }

          set({
            coreSlots: nextCoreSlots,
            peripherals: nextPeripherals,
            evaluation: evaluation ?? null,
            isEvaluating: false,
            evaluationSeq: nextSeq,
            highlightedSlotCode: null,
            acknowledgedWarnings: false,
            slotNotice: null,
          });

          if (!evaluation && distinctIds.size > 0) {
            void get().triggerEvaluate({ immediate: true });
          }
        },

        clearBuild: () => {
          clearPendingDebounce();
          abortInFlightEvaluation();
          const nextSeq = get().evaluationSeq + 1;

          set({
            coreSlots: createEmptyCoreSlots(),
            peripherals: createEmptyPeripherals(),
            evaluation: null,
            isEvaluating: false,
            evaluationSeq: nextSeq,
            highlightedSlotCode: null,
            acknowledgedWarnings: false,
            slotNotice: null,
          });

          try {
            localStorage.removeItem(PC_BUILDER_STORAGE_KEY);
          } catch {
            // Ignore storage access failures in restricted environments
          }
        },

        setEvaluation: (evaluation) => {
          set({ evaluation });
        },

        setHighlightedSlot: (slotCode) => {
          set({ highlightedSlotCode: slotCode });
        },

        setAcknowledgedWarnings: (acknowledged) => {
          set({ acknowledgedWarnings: acknowledged });
        },

        setWarningsAcknowledged: (acknowledged) => {
          set({ acknowledgedWarnings: acknowledged });
        },

        clearSlotNotice: () => {
          set({ slotNotice: null });
        },

        getSelectedItemsInput: () => {
          const { coreSlots, peripherals } = get();
          const result: BuildItemInput[] = [];

          for (const slotCode of CORE_SLOT_CODES) {
            for (const item of coreSlots[slotCode] || []) {
              if (item?.product?.product_id && item.quantity > 0) {
                result.push({
                  product_id: item.product.product_id,
                  quantity: item.quantity,
                  slot_code: slotCode,
                });
              }
            }
          }

          for (const slotCode of PERIPHERAL_SLOT_CODES) {
            for (const item of peripherals[slotCode] || []) {
              if (item?.product?.product_id && item.quantity > 0) {
                result.push({
                  product_id: item.product.product_id,
                  quantity: item.quantity,
                  slot_code: slotCode,
                });
              }
            }
          }

          return result;
        },

        triggerEvaluate: (options) => {
          clearPendingDebounce();
          if (options?.immediate) {
            return executeEvaluate();
          }
          evaluateDebounceTimer = setTimeout(() => {
            evaluateDebounceTimer = null;
            void executeEvaluate();
          }, EVALUATE_DEBOUNCE_MS);
        },
      };
    },
    {
      name: PC_BUILDER_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        coreSlots: state.coreSlots,
        peripherals: state.peripherals,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as
          | (Partial<PCBuilderStoreState> & {
              peripherals?: Record<string, SelectedSlotItem[] | undefined>;
            })
          | undefined;
        const mergedCoreSlots = {
          ...createEmptyCoreSlots(),
          ...(persisted?.coreSlots || {}),
        };
        const legacySataItems = persisted?.peripherals?.SSD_SATA;
        if (
          (!mergedCoreSlots.SSD_SATA || mergedCoreSlots.SSD_SATA.length === 0) &&
          Array.isArray(legacySataItems) &&
          legacySataItems.length > 0
        ) {
          mergedCoreSlots.SSD_SATA = legacySataItems;
        }
        const mergedPeripherals = createEmptyPeripherals();
        for (const code of PERIPHERAL_SLOT_CODES) {
          const items = persisted?.peripherals?.[code];
          if (Array.isArray(items)) {
            mergedPeripherals[code] = items;
          }
        }
        return {
          ...currentState,
          coreSlots: mergedCoreSlots,
          peripherals: mergedPeripherals,
        };
      },
    }
  )
);
