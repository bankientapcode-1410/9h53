import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CART_STORAGE_KEY, useCartStore } from './useCartStore';
import { usePCBuilderStore } from './usePCBuilderStore';
import { pcBuilderService } from '@/services/pcBuilderService';
import { productService } from '@/services/productService';
import { ProductCard } from '@/features/product-catalog/components/ProductCard';
import { ProductDetailPage } from '@/features/product-catalog/pages/ProductDetailPage';
import { PCBuilderPage } from '@/features/pc-builder/pages/PCBuilderPage';
import { CORE_SLOT_CONFIGS, TOTAL_CORE_SLOTS } from '@/features/pc-builder/constants/slotConfig';
import type {
  PCBuilderEvaluateResponse,
  SlotDiagnosticDTO,
  ValidatedCartItemDTO,
} from '@/features/pc-builder/types/builder.types';
import type {
  ProductDetailDTO,
  ProductSummaryDTO,
} from '@/features/product-catalog/types/product.types';

const h = React.createElement;

function makeCpuSummary(overrides?: Partial<ProductSummaryDTO>): ProductSummaryDTO {
  return {
    product_id: 'prod-cpu-14700k',
    name: 'Intel Core i7-14700K',
    brand: 'Intel',
    category_code: 'CPU',
    category_name: 'Vi xử lý (CPU)',
    image_url: 'https://cdn.example.com/cpu.png',
    price: 10990000,
    in_stock: true,
    benchmark_score: 215,
    key_specs: {
      socket_type: 'LGA1700',
      tdp_w: 125,
    },
    ...overrides,
  };
}

function makeGpuSummary(overrides?: Partial<ProductSummaryDTO>): ProductSummaryDTO {
  return {
    product_id: 'prod-gpu-rtx4070s',
    name: 'ASUS DUAL GeForce RTX 4070 SUPER 12GB',
    brand: 'ASUS',
    category_code: 'GPU',
    category_name: 'Card đồ họa (VGA)',
    image_url: 'https://cdn.example.com/gpu.png',
    price: 18490000,
    in_stock: true,
    benchmark_score: 245,
    key_specs: {
      tdp_w: 220,
      recommended_psu_w: 650,
    },
    ...overrides,
  };
}

function makeEvaluation(
  overrides?: Partial<PCBuilderEvaluateResponse>
): PCBuilderEvaluateResponse {
  const slot_statuses = CORE_SLOT_CONFIGS.filter((cfg) => cfg.is_core).reduce(
    (acc, cfg) => {
      acc[cfg.slot_code] = {
        status: 'EMPTY',
        error_count: 0,
        warning_count: 0,
        info_count: 0,
        violation_rule_ids: [],
      };
      return acc;
    },
    {} as Record<string, SlotDiagnosticDTO>
  );
  slot_statuses.CPU = {
    status: 'COMPATIBLE',
    error_count: 0,
    warning_count: 0,
    info_count: 0,
    violation_rule_ids: [],
  };

  return {
    gate_status: 'READY_SAFE',
    telemetry: {
      total_price: 10990000,
      estimated_tdp_w: 205,
      recommended_psu_w: 550,
      selected_psu_wattage_w: null,
      psu_load_percent: null,
      balance_index: null,
      balance_label: 'Cơ bản',
      selected_core_slots: 1,
      total_core_slots: TOTAL_CORE_SLOTS,
      evaluation_time_ms: 4.5,
    },
    slot_statuses,
    compatibility: {
      is_compatible: true,
      errors: [],
      warnings: [],
      info: [],
    },
    stock_issues: [],
    missing_recommended_slots: [],
    ...overrides,
  };
}

describe('useCartStore & UC2 Wave 5 Integration (WBS 7.5.6)', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.getState().clearCart();
    usePCBuilderStore.getState().clearBuild();
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useCartStore state & smartpc_cart_v1 persistence', () => {
    it('adds build bundle, computes totalItemsCount & subtotalPrice, and persists to localStorage', () => {
      const bundle: ValidatedCartItemDTO[] = [
        {
          product_id: 'cpu-1',
          name: 'Intel Core i7-14700K',
          slot_code: 'CPU',
          category_code: 'CPU',
          image_url: '/cpu.png',
          unit_price: 10990000,
          quantity: 1,
          line_total: 10990000,
          available_stock: 12,
        },
        {
          product_id: 'ram-1',
          name: 'Corsair Vengeance 32GB DDR5',
          slot_code: 'RAM',
          category_code: 'RAM',
          image_url: '/ram.png',
          unit_price: 3200000,
          quantity: 2,
          line_total: 6400000,
          available_stock: 8,
        },
      ];

      useCartStore.getState().addBuildBundle(bundle);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.totalItemsCount()).toBe(3);
      expect(state.subtotalPrice()).toBe(17390000);
      expect(state.updated_at).not.toBeNull();

      const rawPersisted = localStorage.getItem(CART_STORAGE_KEY);
      expect(rawPersisted).toBeTruthy();
      const parsed = JSON.parse(rawPersisted as string);
      expect(parsed.state.items).toHaveLength(2);
    });

    it('merges duplicate product_ids on repeated addBuildBundle and clamps to available_stock', () => {
      const ramItem: ValidatedCartItemDTO = {
        product_id: 'ram-1',
        name: 'Corsair Vengeance 32GB DDR5',
        slot_code: 'RAM',
        category_code: 'RAM',
        image_url: '/ram.png',
        unit_price: 3200000,
        quantity: 2,
        line_total: 6400000,
        available_stock: 3,
      };

      useCartStore.getState().addBuildBundle([ramItem]);
      useCartStore.getState().addBuildBundle([ramItem]);

      const merged = useCartStore.getState().items[0];
      expect(merged.quantity).toBe(3); // clamped to available_stock=3
      expect(merged.line_total).toBe(9600000);
      expect(useCartStore.getState().totalItemsCount()).toBe(3);

      useCartStore.getState().updateItemQuantity('ram-1', -2);
      expect(useCartStore.getState().items[0].quantity).toBe(1);
      expect(useCartStore.getState().subtotalPrice()).toBe(3200000);

      useCartStore.getState().removeItem('ram-1');
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('TC-UC2-29: + Builder wiring on ProductCard & ProductDetailPage', () => {
    it('ProductCard + Builder stops propagation, updates usePCBuilderStore, and shows link to /builder', () => {
      const parentClickSpy = vi.fn();
      const gpu = makeGpuSummary();

      render(
        h(
          MemoryRouter,
          null,
          h('div', { onClick: parentClickSpy }, h(ProductCard, { product: gpu }))
        )
      );

      const addBuilderBtn = screen.getByRole('button', { name: /\+ Builder/i });
      fireEvent.click(addBuilderBtn);

      expect(parentClickSpy).not.toHaveBeenCalled();

      const selectedGpu = usePCBuilderStore.getState().coreSlots.GPU;
      expect(selectedGpu).toHaveLength(1);
      expect(selectedGpu[0].product.product_id).toBe(gpu.product_id);

      const toast = screen.getByTestId('product-card-builder-toast');
      expect(toast).toHaveTextContent(/GPU/);
      const builderLink = screen.getByRole('link', { name: /Mở PC Builder/i });
      expect(builderLink).toHaveAttribute('href', '/builder');

      fireEvent.click(builderLink);
      expect(parentClickSpy).not.toHaveBeenCalled();
    });

    it('ProductCard + Builder puts SSD_SATA into coreSlots store and shows Mở PC Builder link', () => {
      const ssdSata = makeGpuSummary({
        product_id: 'e0000001-0000-0000-0000-000000000091',
        name: 'SSD Crucial MX500 500GB 2.5" SATA III',
        brand: 'CRUCIAL',
        category_code: 'SSD_SATA',
        category_name: 'Ổ cứng SSD SATA 2.5"',
        price: 1_290_000,
      });

      render(
        h(MemoryRouter, null, h(ProductCard, { product: ssdSata }))
      );

      fireEvent.click(screen.getByRole('button', { name: /\+ Builder/i }));

      const selectedSata = usePCBuilderStore.getState().coreSlots.SSD_SATA;
      expect(selectedSata).toHaveLength(1);
      expect(selectedSata[0].product.product_id).toBe(ssdSata.product_id);
      expect('SSD_SATA' in usePCBuilderStore.getState().peripherals).toBe(false);

      const toast = screen.getByTestId('product-card-builder-toast');
      expect(toast).toHaveTextContent(/SSD_SATA/);
      expect(screen.getByRole('link', { name: /Mở PC Builder/i })).toHaveAttribute('href', '/builder');
    });

    it('ProductCard + Builder rejects unsupported category gracefully without mutating store', () => {
      const unsupported = makeGpuSummary({
        product_id: 'prod-cable-01',
        category_code: 'UNKNOWN_CABLE',
        category_name: 'Phụ kiện cáp',
      });

      render(
        h(MemoryRouter, null, h(ProductCard, { product: unsupported }))
      );

      fireEvent.click(screen.getByRole('button', { name: /\+ Builder/i }));

      const toast = screen.getByTestId('product-card-builder-toast');
      expect(toast).toHaveTextContent(/chưa hỗ trợ khe PC Builder/i);
      expect(
        screen.queryByRole('link', { name: /Mở PC Builder/i })
      ).not.toBeInTheDocument();
      expect(usePCBuilderStore.getState().getSelectedItemsInput()).toHaveLength(
        0
      );
    });

    it('ProductDetailPage + Đưa vào PC Builder puts component into store and shows Mở PC Builder link', async () => {
      const detailProduct: ProductDetailDTO = {
        product_id: 'prod-gpu-4070ti',
        name: 'ASUS TUF RTX 4070 Ti SUPER 16GB',
        brand: 'ASUS',
        price: 24990000,
        in_stock: true,
        benchmark_score: 265,
        image_url: 'https://cdn.example.com/4070ti.png',
        gallery_urls: [],
        description: 'VGA RTX 4070 Ti SUPER 16GB GDDR6X',
        category: {
          category_id: 'cat-gpu',
          category_code: 'GPU',
          category_name: 'Card đồ họa (VGA)',
        },
        specs: {
          tdp_w: 285,
          recommended_psu_w: 750,
        },
        spec_labels: {},
        created_at: '2026-01-01T00:00:00Z',
      };

      vi.spyOn(productService, 'getProductById').mockResolvedValue({
        success: true,
        status_code: 200,
        message: 'OK',
        data: detailProduct,
      });

      render(
        h(
          MemoryRouter,
          { initialEntries: ['/products/prod-gpu-4070ti'] },
          h(
            Routes,
            null,
            h(Route, {
              path: '/products/:id',
              element: h(ProductDetailPage),
            }),
            h(Route, {
              path: '/builder',
              element: h('div', null, 'Builder Route'),
            })
          )
        )
      );

      const addBuilderBtn = await screen.findByRole('button', {
        name: /\+ Đưa vào PC Builder/i,
      });
      fireEvent.click(addBuilderBtn);

      const selectedGpu = usePCBuilderStore.getState().coreSlots.GPU;
      expect(selectedGpu).toHaveLength(1);
      expect(selectedGpu[0].product.product_id).toBe('prod-gpu-4070ti');

      const toast = screen.getByTestId('product-detail-toast');
      expect(toast).toHaveTextContent(/khe GPU/i);
      const builderLink = screen.getByRole('link', { name: /Mở PC Builder/i });
      expect(builderLink).toHaveAttribute('href', '/builder');
    });
  });

  describe('PCBuilderPage Wave 5 Flows: Share URL, Add-to-Cart Gate & Print Quote', () => {
    it('resolves ?items= share URL, restores slots into store, and shows dropped_product_ids warning', async () => {
      const validCpu = makeCpuSummary({ product_id: 'validCpu' });
      const evalRes = makeEvaluation();

      const resolveSpy = vi
        .spyOn(pcBuilderService, 'resolveShareBuild')
        .mockResolvedValue({
          success: true,
          status_code: 200,
          message: 'OK',
          data: {
            resolved_items: [
              {
                slot_code: 'CPU',
                quantity: 1,
                product: validCpu,
              },
            ],
            dropped_product_ids: ['deletedId'],
            evaluation: evalRes,
          },
        });

      render(
        h(
          MemoryRouter,
          { initialEntries: ['/builder?items=validCpu:1,deletedId:1'] },
          h(
            Routes,
            null,
            h(Route, { path: '/builder', element: h(PCBuilderPage) })
          )
        )
      );

      await waitFor(() => {
        expect(resolveSpy).toHaveBeenCalledWith(
          {
            items: [
              { product_id: 'validCpu', quantity: 1 },
              { product_id: 'deletedId', quantity: 1 },
            ],
          },
          expect.anything()
        );
      });

      const notice = await screen.findByTestId('builder-share-notice');
      expect(notice).toHaveTextContent('deletedId');

      const storeCpu = usePCBuilderStore.getState().coreSlots.CPU;
      expect(storeCpu).toHaveLength(1);
      expect(storeCpu[0].product.product_id).toBe('validCpu');
    });

    it('wires READY_SAFE Add-to-Cart CTA to pcBuilderService.addBuildToCart & useCartStore', async () => {
      const cpu = makeCpuSummary();
      const evalRes = makeEvaluation({ gate_status: 'READY_SAFE' });
      usePCBuilderStore.getState().loadFromResolved(
        [{ slot_code: 'CPU', quantity: 1, product: cpu }],
        evalRes
      );

      const addCartSpy = vi
        .spyOn(pcBuilderService, 'addBuildToCart')
        .mockResolvedValue({
          success: true,
          status_code: 200,
          message: 'OK',
          data: {
            cart_persisted: false,
            cart_id: null,
            gate_status: 'READY_SAFE',
            items: [
              {
                product_id: cpu.product_id,
                name: cpu.name,
                slot_code: 'CPU',
                category_code: 'CPU',
                image_url: cpu.image_url,
                unit_price: cpu.price,
                quantity: 1,
                line_total: cpu.price,
                available_stock: 10,
              },
            ],
            added_items_count: 1,
            subtotal_price: cpu.price,
          },
        });

      render(
        h(
          MemoryRouter,
          { initialEntries: ['/builder'] },
          h(
            Routes,
            null,
            h(Route, { path: '/builder', element: h(PCBuilderPage) })
          )
        )
      );

      const ctaBtn = screen.getByTestId('builder-gate-cta-btn');
      fireEvent.click(ctaBtn);

      await waitFor(() => {
        expect(addCartSpy).toHaveBeenCalledWith({
          items: [{ product_id: cpu.product_id, quantity: 1, slot_code: 'CPU' }],
          acknowledged_warnings: false,
        });
      });

      await waitFor(() => {
        expect(useCartStore.getState().totalItemsCount()).toBe(1);
      });
      expect(useCartStore.getState().subtotalPrice()).toBe(cpu.price);
    });

    it('copies Share URL via clipboard and triggers A4 Print Quote modal', async () => {
      const cpu = makeCpuSummary();
      const evalRes = makeEvaluation({ gate_status: 'READY_SAFE' });
      usePCBuilderStore.getState().loadFromResolved(
        [{ slot_code: 'CPU', quantity: 1, product: cpu }],
        evalRes
      );

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: writeTextMock },
      });
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      render(
        h(
          MemoryRouter,
          { initialEntries: ['/builder'] },
          h(
            Routes,
            null,
            h(Route, { path: '/builder', element: h(PCBuilderPage) })
          )
        )
      );

      fireEvent.click(screen.getByTestId('builder-share-btn'));

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledTimes(1);
      });
      expect(writeTextMock.mock.calls[0][0]).toContain(
        `/builder?items=${cpu.product_id}:1`
      );
      expect(await screen.findByTestId('builder-share-notice')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('builder-print-btn'));
      expect(
        screen.getByTestId('builder-print-sheet-modal')
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('print-sheet-trigger-btn'));
      expect(printSpy).toHaveBeenCalledTimes(1);
    });
  });
});
