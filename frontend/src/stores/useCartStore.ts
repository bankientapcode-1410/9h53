import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ValidatedCartItemDTO } from '@/features/pc-builder/types/builder.types';

export const CART_STORAGE_KEY = 'smartpc_cart_v1';

export interface CartStoreState {
  items: ValidatedCartItemDTO[];
  updated_at: string | null;

  totalItemsCount: () => number;
  subtotalPrice: () => number;
  addBuildBundle: (bundleItems: ValidatedCartItemDTO[]) => void;
  addItem: (item: ValidatedCartItemDTO) => void;
  updateItemQuantity: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      updated_at: null,

      totalItemsCount: () =>
        get().items.reduce((sum, item) => sum + Math.max(0, item.quantity || 0), 0),

      subtotalPrice: () =>
        get().items.reduce(
          (sum, item) =>
            sum +
            (typeof item.line_total === 'number'
              ? item.line_total
              : (item.unit_price || 0) * (item.quantity || 0)),
          0
        ),

      addBuildBundle: (bundleItems) => {
        if (!Array.isArray(bundleItems) || bundleItems.length === 0) {
          return;
        }

        const nextItems = get().items.map((item) => ({ ...item }));

        for (const incoming of bundleItems) {
          if (!incoming?.product_id || (incoming.quantity ?? 0) <= 0) {
            continue;
          }

          const unitPrice = Math.max(0, Number(incoming.unit_price) || 0);
          const incomingQty = Math.max(1, Math.floor(incoming.quantity));
          const existingIdx = nextItems.findIndex(
            (item) => item.product_id === incoming.product_id
          );

          if (existingIdx >= 0) {
            const existing = nextItems[existingIdx];
            const rawQty = existing.quantity + incomingQty;
            const maxStock =
              incoming.available_stock > 0
                ? incoming.available_stock
                : existing.available_stock;
            const nextQty = maxStock > 0 ? Math.min(maxStock, rawQty) : rawQty;

            nextItems[existingIdx] = {
              ...existing,
              slot_code: incoming.slot_code || existing.slot_code,
              name: incoming.name || existing.name,
              category_code: incoming.category_code || existing.category_code,
              image_url: incoming.image_url ?? existing.image_url,
              unit_price: unitPrice,
              quantity: nextQty,
              line_total: unitPrice * nextQty,
              available_stock:
                incoming.available_stock ?? existing.available_stock,
            };
          } else {
            const nextQty =
              incoming.available_stock > 0
                ? Math.min(incoming.available_stock, incomingQty)
                : incomingQty;

            nextItems.push({
              ...incoming,
              unit_price: unitPrice,
              quantity: nextQty,
              line_total: unitPrice * nextQty,
            });
          }
        }

        set({
          items: nextItems,
          updated_at: new Date().toISOString(),
        });
      },

      addItem: (item) => {
        get().addBuildBundle([item]);
      },

      updateItemQuantity: (productId, delta) => {
        if (!productId || !delta) return;
        const current = get().items;
        const target = current.find((item) => item.product_id === productId);
        if (!target) return;

        const rawNext = target.quantity + delta;
        if (rawNext <= 0) {
          get().removeItem(productId);
          return;
        }

        const clampedQty =
          target.available_stock > 0
            ? Math.min(target.available_stock, rawNext)
            : rawNext;

        const nextItems = current.map((item) =>
          item.product_id === productId
            ? {
                ...item,
                quantity: clampedQty,
                line_total: item.unit_price * clampedQty,
              }
            : item
        );

        set({
          items: nextItems,
          updated_at: new Date().toISOString(),
        });
      },

      removeItem: (productId) => {
        if (!productId) return;
        const nextItems = get().items.filter(
          (item) => item.product_id !== productId
        );
        set({
          items: nextItems,
          updated_at: nextItems.length > 0 ? new Date().toISOString() : null,
        });
      },

      clearCart: () => {
        set({
          items: [],
          updated_at: null,
        });
        try {
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch {
          // Ignore storage access errors in restricted environments
        }
      },
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        updated_at: state.updated_at,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CartStoreState> | undefined;
        return {
          ...currentState,
          items: Array.isArray(persisted?.items) ? persisted.items : [],
          updated_at: persisted?.updated_at ?? null,
        };
      },
    }
  )
);
