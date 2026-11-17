import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiResponse, ProductSummaryDTO } from '@/features/product-catalog/types/product.types';
import type {
  CompatibilityViolation,
  PCBuilderEvaluateResponse,
  QuickFixResponse,
} from '@/features/pc-builder/types/builder.types';
import { getQuickFixOffline, pcBuilderService } from '@/services/pcBuilderService';
import { EVALUATE_DEBOUNCE_MS, usePCBuilderStore } from '@/stores/usePCBuilderStore';
import { QuickFixPanel } from './QuickFixPanel';
import { SlotViolationBanner } from './SlotViolationBanner';

const RULE_SOCKET = 'r0000001-0000-0000-0000-000000000001';

const cpuI9: ProductSummaryDTO = {
  product_id: 'cpu-i9-14900k',
  name: 'Intel Core i9-14900K',
  brand: 'INTEL',
  category_code: 'CPU',
  category_name: 'Bộ vi xử lý (CPU)',
  image_url: '',
  price: 14_990_000,
  in_stock: true,
  benchmark_score: 98,
  key_specs: { socket_type: 'LGA1700', tdp_w: 125 },
};

const mbB650: ProductSummaryDTO = {
  product_id: 'mb-b650-am5',
  name: 'MSI MAG B650 TOMAHAWK WIFI',
  brand: 'MSI',
  category_code: 'MOTHERBOARD',
  category_name: 'Bo mạch chủ (Mainboard)',
  image_url: '',
  price: 6_490_000,
  in_stock: true,
  benchmark_score: 82,
  key_specs: { supported_sockets: ['AM5'], supported_memory_types: ['DDR5'] },
};

const mbZ790: ProductSummaryDTO = {
  product_id: 'mb-z790-aorus',
  name: 'GIGABYTE Z790 AORUS ELITE AX',
  brand: 'GIGABYTE',
  category_code: 'MOTHERBOARD',
  category_name: 'Bo mạch chủ (Mainboard)',
  image_url: '',
  price: 6_990_000,
  in_stock: true,
  benchmark_score: 88,
  key_specs: { supported_sockets: ['LGA1700'], supported_memory_types: ['DDR5'] },
};

const socketViolation: CompatibilityViolation = {
  rule_id: RULE_SOCKET,
  rule_name: 'CPU-Motherboard Socket Match',
  severity: 'ERROR',
  message: 'CPU socket LGA1700 không tương thích với Mainboard (hỗ trợ: AM5).',
  source_product: { id: cpuI9.product_id, name: cpuI9.name, category_code: 'CPU' },
  target_product: { id: mbB650.product_id, name: mbB650.name, category_code: 'MOTHERBOARD' },
};

function makeErrorEval(): PCBuilderEvaluateResponse {
  return {
    compatibility: {
      is_compatible: false,
      errors: [socketViolation],
      warnings: [],
      info: [],
      unresolved_product_ids: [],
    },
    telemetry: {
      total_price: cpuI9.price + mbB650.price,
      estimated_tdp_w: 175,
      recommended_psu_w: 450,
      selected_psu_wattage_w: null,
      psu_load_percent: null,
      balance_index: 75,
      balance_label: 'KHÁ TỐT',
      selected_core_slots: 2,
      total_core_slots: 8,
      evaluation_time_ms: 2.1,
    },
    slot_statuses: {
      CPU: {
        status: 'ERROR',
        error_count: 1,
        warning_count: 0,
        info_count: 0,
        violation_rule_ids: [RULE_SOCKET],
      },
      MOTHERBOARD: {
        status: 'ERROR',
        error_count: 1,
        warning_count: 0,
        info_count: 0,
        violation_rule_ids: [RULE_SOCKET],
      },
    },
    gate_status: 'BLOCKED_COMPATIBILITY_ERROR',
    stock_issues: [],
    missing_recommended_slots: ['RAM', 'SSD_M2', 'PSU', 'CASE'],
  };
}

function makeCleanEval(): PCBuilderEvaluateResponse {
  return {
    compatibility: {
      is_compatible: true,
      errors: [],
      warnings: [],
      info: [],
      unresolved_product_ids: [],
    },
    telemetry: {
      total_price: cpuI9.price + mbZ790.price,
      estimated_tdp_w: 175,
      recommended_psu_w: 450,
      selected_psu_wattage_w: null,
      psu_load_percent: null,
      balance_index: 80,
      balance_label: 'CÂN BẰNG TỐT',
      selected_core_slots: 2,
      total_core_slots: 8,
      evaluation_time_ms: 1.4,
    },
    slot_statuses: {
      CPU: {
        status: 'COMPATIBLE',
        error_count: 0,
        warning_count: 0,
        info_count: 0,
        violation_rule_ids: [],
      },
      MOTHERBOARD: {
        status: 'COMPATIBLE',
        error_count: 0,
        warning_count: 0,
        info_count: 0,
        violation_rule_ids: [],
      },
    },
    gate_status: 'READY_SAFE',
    stock_issues: [],
    missing_recommended_slots: ['RAM', 'SSD_M2', 'PSU', 'CASE'],
  };
}

const MotherboardBannerHarness: React.FC = () => {
  const evaluation = usePCBuilderStore((s) => s.evaluation);
  const mbDiag = evaluation?.slot_statuses?.MOTHERBOARD;

  return (
    <SlotViolationBanner
      slotCode="MOTHERBOARD"
      diagnostic={mbDiag}
      errors={evaluation?.compatibility?.errors}
      warnings={evaluation?.compatibility?.warnings}
      info={evaluation?.compatibility?.info}
      renderQuickFix={(violation) => (
        <QuickFixPanel violation={violation} sourceSlotCode="MOTHERBOARD" />
      )}
    />
  );
};

describe('QuickFixPanel (WBS 7.5.5)', () => {
  beforeEach(() => {
    localStorage.clear();
    usePCBuilderStore.getState().clearBuild();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    usePCBuilderStore.getState().clearBuild();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('TC-UC2-24: Bấm "Gợi ý sửa lỗi" rồi "Áp dụng ngay" thay thế Mainboard Z790, kích hoạt evaluate và xóa banner đỏ', async () => {
    vi.useFakeTimers();

    const evalSpy = vi
      .spyOn(pcBuilderService, 'evaluateBuild')
      .mockResolvedValue({
        success: true,
        status_code: 200,
        message: 'OK',
        data: makeCleanEval(),
      });

    const quickFixPayload: ApiResponse<QuickFixResponse> = {
      success: true,
      status_code: 200,
      message: 'OK',
      data: {
        violation_rule_id: RULE_SOCKET,
        evaluation_time_ms: 4.5,
        strategies: [
          {
            replace_slot: 'MOTHERBOARD',
            current_product_id: mbB650.product_id,
            current_product_name: mbB650.name,
            strategy_label: 'Đổi Mainboard tương thích với CPU Intel Core i9-14900K',
            options: [
              {
                product: mbZ790,
                price_delta: 500_000,
                resulting_status: 'COMPATIBLE',
                remaining_warnings_count: 0,
                cleared_violation_count: 1,
              },
            ],
          },
        ],
      },
    };

    const quickFixSpy = vi
      .spyOn(pcBuilderService, 'getQuickFix')
      .mockResolvedValue(quickFixPayload);

    // Thiết lập store ban đầu với cặp CPU LGA1700 + Mainboard AM5 đang báo lỗi đỏ
    usePCBuilderStore.setState((state) => ({
      ...state,
      coreSlots: {
        ...state.coreSlots,
        CPU: [{ product: cpuI9, quantity: 1 }],
        MOTHERBOARD: [{ product: mbB650, quantity: 1 }],
      },
      evaluation: makeErrorEval(),
    }));

    render(<MotherboardBannerHarness />);

    // Banner đỏ ban đầu hiển thị lỗi socket
    expect(screen.getByTestId('slot-violation-banner-MOTHERBOARD')).toBeInTheDocument();
    expect(screen.getByText(/CPU socket LGA1700 không tương thích/i)).toBeInTheDocument();

    // Click nút "Gợi ý sửa lỗi"
    const triggerBtn = screen.getByRole('button', { name: /Gợi ý sửa lỗi/i });
    await act(async () => {
      fireEvent.click(triggerBtn);
    });

    expect(quickFixSpy).toHaveBeenCalledTimes(1);
    expect(quickFixSpy.mock.calls[0][0]).toMatchObject({
      violation_rule_id: RULE_SOCKET,
      preferred_replace_slot: 'MOTHERBOARD',
      source_product_id: cpuI9.product_id,
      target_product_id: mbB650.product_id,
    });

    // Hiển thị thẻ gợi ý Z790 + chênh lệch giá +500.000đ + nút "Áp dụng ngay"
    expect(screen.getByText('GIGABYTE Z790 AORUS ELITE AX')).toBeInTheDocument();
    expect(screen.getByText(/\+500\.000đ/)).toBeInTheDocument();

    const applyBtn = screen.getByRole('button', { name: /Áp dụng ngay/i });
    await act(async () => {
      fireEvent.click(applyBtn);
    });

    // Store đã thay thế B650 -> Z790 ngay lập tức
    const updatedMbSlot = usePCBuilderStore.getState().coreSlots.MOTHERBOARD;
    expect(updatedMbSlot).toHaveLength(1);
    expect(updatedMbSlot[0].product.product_id).toBe(mbZ790.product_id);

    // Hết debounce 150ms -> evaluateBuild chạy và cập nhật cấu hình sạch lỗi -> banner đỏ biến mất
    await act(async () => {
      await vi.advanceTimersByTimeAsync(EVALUATE_DEBOUNCE_MS);
    });

    expect(evalSpy).toHaveBeenCalledTimes(1);
    expect(usePCBuilderStore.getState().evaluation?.gate_status).toBe('READY_SAFE');
    expect(screen.queryByTestId('slot-violation-banner-MOTHERBOARD')).not.toBeInTheDocument();
  });

  it('QuickFixPanel không hiển thị nút gợi ý cho thông báo mức INFO và hỗ trợ offline simulator trên MOCK_PRODUCTS', () => {
    const infoViolation: CompatibilityViolation = {
      rule_id: 'r0000001-0000-0000-0000-000000000010',
      rule_name: 'PCIe Generation',
      severity: 'INFO',
      message: 'Card đồ họa chạy chuẩn PCIe 5.0 trên khe PCIe 4.0.',
      source_product: null,
      target_product: null,
    };

    const { container } = render(<QuickFixPanel violation={infoViolation} />);
    expect(container.firstChild).toBeNull();

    // Kiểm tra offline fallback trên MOCK_PRODUCTS thực tế: i7-14700K (LGA1700) + B650 (AM5)
    const offlineResp = getQuickFixOffline({
      current_items: [
        { product_id: 'e0000001-0000-0000-0000-000000000002', quantity: 1, slot_code: 'CPU' },
        { product_id: 'e0000001-0000-0000-0000-000000000007', quantity: 1, slot_code: 'MOTHERBOARD' },
      ],
      violation_rule_id: RULE_SOCKET,
      source_product_id: 'e0000001-0000-0000-0000-000000000002',
      target_product_id: 'e0000001-0000-0000-0000-000000000007',
    });

    expect(offlineResp.strategies.length).toBeGreaterThanOrEqual(2);
    expect(offlineResp.strategies[0].replace_slot).toBe('MOTHERBOARD');
    expect(offlineResp.strategies[0].options.length).toBeGreaterThan(0);
    expect(offlineResp.strategies[0].options[0].resulting_status).toBe('COMPATIBLE');
  });
});
