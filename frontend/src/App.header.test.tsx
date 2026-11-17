import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import { PCBuilderPage } from './features/pc-builder/pages/PCBuilderPage';
import { useCartStore } from './stores/useCartStore';
import { usePCBuilderStore } from './stores/usePCBuilderStore';
import { pcBuilderService } from './services/pcBuilderService';
import { CORE_SLOT_CONFIGS } from './features/pc-builder/constants/slotConfig';
import type {
  PCBuilderEvaluateResponse,
  SlotDiagnosticDTO,
} from './features/pc-builder/types/builder.types';
import type { ProductSummaryDTO } from './features/product-catalog/types/product.types';

const h = React.createElement;

function makeSummary(
  id: string,
  name: string,
  category_code: string,
  price: number,
  key_specs: Record<string, string | number | boolean | string[]>
): ProductSummaryDTO {
  return {
    product_id: id,
    name,
    brand: category_code === 'CPU' ? 'Intel' : 'MSI',
    category_code,
    category_name: category_code,
    image_url: `https://cdn.example.com/${id}.png`,
    price,
    in_stock: true,
    benchmark_score: 180,
    key_specs,
  };
}

function emptySlotStatuses(): Record<string, SlotDiagnosticDTO> {
  return CORE_SLOT_CONFIGS.filter((cfg) => cfg.is_core).reduce(
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
}

describe('Final Wave Integration: App Header Compliance (TC-UC2-30) & End-to-End Smoke Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.getState().clearCart();
    usePCBuilderStore.getState().clearBuild();
    window.history.pushState({}, '', '/');
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('TC-UC2-30: renders Bright 3-layer Header at /builder with exact "PC Builder" label (no (AI)/PRO) and live cart count 3', async () => {
    useCartStore.getState().addBuildBundle([
      {
        product_id: 'cpu-1',
        name: 'Intel Core i5-14600K',
        slot_code: 'CPU',
        category_code: 'CPU',
        image_url: '/cpu.png',
        unit_price: 7990000,
        quantity: 1,
        line_total: 7990000,
        available_stock: 10,
      },
      {
        product_id: 'ram-1',
        name: 'Corsair Vengeance 16GB',
        slot_code: 'RAM',
        category_code: 'RAM',
        image_url: '/ram.png',
        unit_price: 1500000,
        quantity: 2,
        line_total: 3000000,
        available_stock: 10,
      },
    ]);

    window.history.pushState({}, '', '/builder');
    render(h(App));

    // Route /builder mounts PCBuilderPage heading
    expect(
      await screen.findByRole('heading', { name: /Xây dựng cấu hình PC/i })
    ).toBeInTheDocument();

    // Tier 2 navigation bar has exact "PC Builder" label linking to /builder without "(AI)" or "PRO"
    const header = document.querySelector('header');
    expect(header).not.toBeNull();
    const navLinks = header!.querySelectorAll('nav a');
    expect(navLinks).toHaveLength(5);
    expect(Array.from(navLinks).map((el) => el.textContent?.trim())).toEqual([
      'Sản phẩm',
      'Danh mục linh kiện',
      'PC Builder',
      'PC Profile',
      'Hỗ trợ kỹ thuật',
    ]);

    const builderNavLink = screen.getByRole('link', { name: 'PC Builder' });
    expect(builderNavLink).toHaveAttribute('href', '/builder');
    expect(builderNavLink.textContent?.trim()).toBe('PC Builder');
    expect(header!.textContent).not.toContain('PC Builder (AI)');
    expect(header!.textContent).not.toMatch(/\bPRO\b/);

    // Tier 1 cart badge displays live count 3 from useCartStore
    expect(screen.getByTestId('header-cart-badge')).toHaveTextContent('3');
  });

  it('Smoke flow: select incompatible CPU + Mainboard -> evaluate -> QuickFixPanel -> apply fix -> READY_SAFE -> add-to-cart updates useCartStore', async () => {
    const cpu = makeSummary('cpu-lga1700', 'Intel Core i5-14600K', 'CPU', 7990000, {
      socket_type: 'LGA1700',
      tdp_w: 125,
    });
    const wrongMob = makeSummary(
      'mob-am5',
      'MSI MAG B650 TOMAHAWK WIFI',
      'MOTHERBOARD',
      5990000,
      { supported_sockets: ['AM5'], form_factor: 'ATX' }
    );
    const fixedMob = makeSummary(
      'mob-lga1700',
      'ASUS TUF GAMING B760M-PLUS WIFI',
      'MOTHERBOARD',
      4690000,
      { supported_sockets: ['LGA1700'], form_factor: 'mATX' }
    );

    const conflictStatuses = emptySlotStatuses();
    conflictStatuses.CPU = {
      status: 'ERROR',
      error_count: 1,
      warning_count: 0,
      info_count: 0,
      violation_rule_ids: ['rule-socket-01'],
    };
    conflictStatuses.MOTHERBOARD = {
      status: 'ERROR',
      error_count: 1,
      warning_count: 0,
      info_count: 0,
      violation_rule_ids: ['rule-socket-01'],
    };

    const conflictEval: PCBuilderEvaluateResponse = {
      gate_status: 'BLOCKED_COMPATIBILITY_ERROR',
      compatibility: {
        is_compatible: false,
        errors: [
          {
            rule_id: 'rule-socket-01',
            rule_name: 'CPU-Motherboard Socket Match',
            severity: 'ERROR',
            message: 'CPU LGA1700 không lắp vừa Mainboard AM5',
            source_product: {
              id: cpu.product_id,
              name: cpu.name,
              category_code: 'CPU',
            },
            target_product: {
              id: wrongMob.product_id,
              name: wrongMob.name,
              category_code: 'MOTHERBOARD',
            },
          },
        ],
        warnings: [],
        info: [],
      },
      telemetry: {
        total_price: 13980000,
        estimated_tdp_w: 175,
        recommended_psu_w: 500,
        selected_psu_wattage_w: null,
        psu_load_percent: null,
        balance_index: 75,
        balance_label: 'Cơ bản',
        selected_core_slots: 2,
        total_core_slots: 8,
        evaluation_time_ms: 2.4,
      },
      slot_statuses: conflictStatuses,
      stock_issues: [],
      missing_recommended_slots: [],
    };

    const safeStatuses = emptySlotStatuses();
    safeStatuses.CPU = {
      status: 'COMPATIBLE',
      error_count: 0,
      warning_count: 0,
      info_count: 0,
      violation_rule_ids: [],
    };
    safeStatuses.MOTHERBOARD = {
      status: 'COMPATIBLE',
      error_count: 0,
      warning_count: 0,
      info_count: 0,
      violation_rule_ids: [],
    };

    const safeEval: PCBuilderEvaluateResponse = {
      gate_status: 'READY_SAFE',
      compatibility: {
        is_compatible: true,
        errors: [],
        warnings: [],
        info: [],
      },
      telemetry: {
        total_price: 12680000,
        estimated_tdp_w: 175,
        recommended_psu_w: 500,
        selected_psu_wattage_w: null,
        psu_load_percent: null,
        balance_index: 80,
        balance_label: 'Cân bằng tốt',
        selected_core_slots: 2,
        total_core_slots: 8,
        evaluation_time_ms: 1.9,
      },
      slot_statuses: safeStatuses,
      stock_issues: [],
      missing_recommended_slots: [],
    };

    vi.spyOn(pcBuilderService, 'evaluateBuild').mockImplementation(async (req) => {
      const hasFixedMob = req.items.some((i) => i.product_id === fixedMob.product_id);
      return {
        success: true,
        status_code: 200,
        message: 'OK',
        data: hasFixedMob ? safeEval : conflictEval,
      };
    });

    vi.spyOn(pcBuilderService, 'getQuickFix').mockResolvedValue({
      success: true,
      status_code: 200,
      message: 'OK',
      data: {
        violation_rule_id: 'rule-socket-01',
        strategies: [
          {
            replace_slot: 'MOTHERBOARD',
            current_product_id: wrongMob.product_id,
            current_product_name: wrongMob.name,
            strategy_label: 'Đổi Mainboard LGA1700 khớp CPU',
            options: [
              {
                product: fixedMob,
                price_delta: fixedMob.price - wrongMob.price,
                resulting_status: 'COMPATIBLE',
                remaining_warnings_count: 0,
                cleared_violation_count: 1,
              },
            ],
          },
        ],
        evaluation_time_ms: 5.2,
      },
    });

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
          added_items_count: 2,
          subtotal_price: 12680000,
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
            {
              product_id: fixedMob.product_id,
              name: fixedMob.name,
              slot_code: 'MOTHERBOARD',
              category_code: 'MOTHERBOARD',
              image_url: fixedMob.image_url,
              unit_price: fixedMob.price,
              quantity: 1,
              line_total: fixedMob.price,
              available_stock: 8,
            },
          ],
        },
      });

    render(
      h(
        MemoryRouter,
        { initialEntries: ['/builder'] },
        h(Routes, null, h(Route, { path: '/builder', element: h(PCBuilderPage) }))
      )
    );

    // 1. Select incompatible CPU + Mainboard in store -> triggers debounced evaluate
    usePCBuilderStore.getState().selectProduct('CPU', cpu);
    usePCBuilderStore.getState().selectProduct('MOTHERBOARD', wrongMob);

    // 2. Inline SlotViolationBanner + wired QuickFixPanel ("Gợi ý sửa lỗi") appear and Gatekeeper blocks cart
    const quickFixBtns = await screen.findAllByRole('button', {
      name: /Gợi ý sửa lỗi/i,
    });
    expect(quickFixBtns.length).toBeGreaterThan(0);
    expect(screen.getByTestId('builder-gate-cta-btn')).toBeDisabled();

    // 3. Click Quick Fix suggestion -> fetch & apply compatible Mainboard
    fireEvent.click(quickFixBtns[0]);
    const applyBtn = await screen.findByRole('button', {
      name: /Áp dụng ngay/i,
    });
    fireEvent.click(applyBtn);

    // 4. Re-evaluation resolves to READY_SAFE and unlocks Add-to-Cart CTA
    await waitFor(() => {
      expect(screen.getByTestId('builder-gate-cta-btn')).not.toBeDisabled();
    });
    expect(
      usePCBuilderStore.getState().coreSlots.MOTHERBOARD[0].product.product_id
    ).toBe(fixedMob.product_id);

    // 5. Add full build to cart -> updates useCartStore
    fireEvent.click(screen.getByTestId('builder-gate-cta-btn'));

    await waitFor(() => {
      expect(addCartSpy).toHaveBeenCalledTimes(1);
      expect(useCartStore.getState().totalItemsCount()).toBe(2);
    });
    expect(screen.getByTestId('builder-gate-feedback')).toHaveTextContent(
      /Đã thêm trọn bộ cấu hình/i
    );
  });
});
