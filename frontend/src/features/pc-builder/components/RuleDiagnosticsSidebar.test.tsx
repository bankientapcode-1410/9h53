import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ProductSummaryDTO } from '@/features/product-catalog/types/product.types';
import type {
  AskAIBuildEventDetail,
  BuildItemInput,
  CompatibilityViolation,
  PCBuilderEvaluateResponse,
} from '@/features/pc-builder/types/builder.types';
import { AIChatWidget } from '@/features/ai-chat/components/AIChatWidget';
import { aiChatService } from '@/services/aiChatService';
import { usePCBuilderStore } from '@/stores/usePCBuilderStore';
import { PCBuilderPage } from '@/features/pc-builder/pages/PCBuilderPage';
import { RuleDiagnosticsSidebar } from './RuleDiagnosticsSidebar';
import { SlotViolationBanner } from './SlotViolationBanner';

const makeProduct = (
  overrides: Partial<ProductSummaryDTO> & {
    product_id: string;
    category_code: string;
  }
): ProductSummaryDTO => ({
  name: `Sản phẩm ${overrides.product_id}`,
  brand: 'ASUS',
  category_name: overrides.category_code,
  image_url: '',
  price: 5_000_000,
  in_stock: true,
  benchmark_score: 85,
  key_specs: {},
  ...overrides,
});

const makeDiagnosticsEvaluation = (): PCBuilderEvaluateResponse => {
  const cpuMbError: CompatibilityViolation = {
    rule_id: 'r0000001-0000-0000-0000-000000000001',
    rule_name: 'CPU-Motherboard Socket Match',
    severity: 'ERROR',
    message: 'CPU socket LGA1700 không khớp với Mainboard (hỗ trợ: AM5).',
    source_product: {
      id: 'cpu-14900k',
      name: 'Intel Core i9-14900K',
      category_code: 'CPU',
    },
    target_product: {
      id: 'mb-b650',
      name: 'MSI MAG B650 TOMAHAWK WIFI',
      category_code: 'MOTHERBOARD',
    },
  };

  const psuWarning: CompatibilityViolation = {
    rule_id: 'r0000001-0000-0000-0000-000000000007',
    rule_name: 'PSU Wattage Sufficiency',
    severity: 'WARNING',
    message: 'Tổng TDP ước tính 620W vượt quá công suất bộ nguồn 550W.',
    source_product: null,
    target_product: {
      id: 'psu-550',
      name: 'MSI MAG A550BN 550W',
      category_code: 'PSU',
    },
  };

  const ramInfo: CompatibilityViolation = {
    rule_id: 'r-ram-xmp-info',
    rule_name: 'RAM XMP/EXPO Profile',
    severity: 'INFO',
    message: 'Khuyến nghị bật XMP/EXPO trong BIOS để đạt bus 6000MHz.',
    source_product: {
      id: 'ram-ddr5',
      name: 'Corsair Vengeance 32GB DDR5',
      category_code: 'RAM',
    },
    target_product: null,
  };

  return {
    compatibility: {
      is_compatible: false,
      errors: [cpuMbError],
      warnings: [psuWarning],
      info: [ramInfo],
      unresolved_product_ids: [],
    },
    telemetry: {
      total_price: 25_400_000,
      estimated_tdp_w: 620,
      recommended_psu_w: 850,
      selected_psu_wattage_w: 550,
      psu_load_percent: 112.7,
      balance_index: 84,
      balance_label: 'CÂN BẰNG TỐT',
      selected_core_slots: 4,
      total_core_slots: 8,
      evaluation_time_ms: 2.1,
    },
    slot_statuses: {
      CPU: {
        status: 'ERROR',
        error_count: 1,
        warning_count: 0,
        info_count: 0,
        violation_rule_ids: ['r0000001-0000-0000-0000-000000000001'],
      },
      MOTHERBOARD: {
        status: 'ERROR',
        error_count: 1,
        warning_count: 0,
        info_count: 0,
        violation_rule_ids: ['r0000001-0000-0000-0000-000000000001'],
      },
      PSU: {
        status: 'WARNING',
        error_count: 0,
        warning_count: 1,
        info_count: 0,
        violation_rule_ids: ['r0000001-0000-0000-0000-000000000007'],
      },
      RAM: {
        status: 'INFO',
        error_count: 0,
        warning_count: 0,
        info_count: 1,
        violation_rule_ids: ['r-ram-xmp-info'],
      },
    },
    gate_status: 'BLOCKED_COMPATIBILITY_ERROR',
    stock_issues: [],
    missing_recommended_slots: ['GPU', 'SSD_M2', 'CASE'],
  };
};

describe('RuleDiagnosticsSidebar & SlotViolationBanner (WBS 7.5.3)', () => {
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

  it('TC-UC2-12: Sidebar xếp thứ tự ERROR -> WARNING -> INFO, hiện hộp vàng PSU và SlotViolationBanner CPU/MOTHERBOARD viền đỏ', () => {
    const evalData = makeDiagnosticsEvaluation();
    const selectedItems: BuildItemInput[] = [
      { product_id: 'cpu-14900k', quantity: 1, slot_code: 'CPU' },
      { product_id: 'mb-b650', quantity: 1, slot_code: 'MOTHERBOARD' },
      { product_id: 'psu-550', quantity: 1, slot_code: 'PSU' },
      { product_id: 'ram-ddr5', quantity: 1, slot_code: 'RAM' },
    ];

    render(
      <div>
        <RuleDiagnosticsSidebar
          evaluation={evalData}
          selectedItems={selectedItems}
          onFocusSlot={vi.fn()}
        />
        <SlotViolationBanner
          slotCode="CPU"
          diagnostic={evalData.slot_statuses.CPU}
          errors={evalData.compatibility.errors}
          warnings={evalData.compatibility.warnings}
          info={evalData.compatibility.info}
        />
        <SlotViolationBanner
          slotCode="MOTHERBOARD"
          diagnostic={evalData.slot_statuses.MOTHERBOARD}
          errors={evalData.compatibility.errors}
          warnings={evalData.compatibility.warnings}
          info={evalData.compatibility.info}
        />
      </div>
    );

    const cards = screen.getAllByTestId(/^diagnostic-card-/);
    expect(cards.map((el) => el.getAttribute('data-testid'))).toEqual([
      'diagnostic-card-ERROR',
      'diagnostic-card-WARNING',
      'diagnostic-card-INFO',
    ]);

    const psuAdvisory = screen.getByTestId('psu-advisory-box');
    expect(psuAdvisory).toBeInTheDocument();
    expect(psuAdvisory).toHaveTextContent('850W');
    expect(psuAdvisory.className).toContain('bg-amber-50');

    const cpuBanner = screen.getByTestId('slot-violation-banner-CPU');
    const mbBanner = screen.getByTestId('slot-violation-banner-MOTHERBOARD');
    expect(cpuBanner.className).toContain('border-smart-red');
    expect(mbBanner.className).toContain('border-smart-red');
    expect(cpuBanner).toHaveTextContent('LGA1700 không khớp với Mainboard');
    expect(mbBanner).toHaveTextContent('LGA1700 không khớp với Mainboard');
  });

  it('SlotViolationBanner giới hạn tối đa 2 thông báo inline, hỗ trợ nút Xem tất cả và renderQuickFix slot', () => {
    const onViewAll = vi.fn();
    const errors: CompatibilityViolation[] = [
      {
        rule_id: 'r1',
        rule_name: 'Rule 1',
        severity: 'ERROR',
        message: 'Lỗi 1 trên Mainboard',
        source_product: { id: '1', name: 'CPU', category_code: 'CPU' },
        target_product: { id: '2', name: 'MB', category_code: 'MOTHERBOARD' },
      },
      {
        rule_id: 'r2',
        rule_name: 'Rule 2',
        severity: 'ERROR',
        message: 'Lỗi 2 trên Mainboard',
        source_product: { id: '3', name: 'RAM', category_code: 'RAM' },
        target_product: { id: '2', name: 'MB', category_code: 'MOTHERBOARD' },
      },
      {
        rule_id: 'r3',
        rule_name: 'Rule 3',
        severity: 'WARNING',
        message: 'Cảnh báo 3 trên Mainboard',
        source_product: { id: '4', name: 'SSD', category_code: 'SSD_M2' },
        target_product: { id: '2', name: 'MB', category_code: 'MOTHERBOARD' },
      },
    ];

    render(
      <SlotViolationBanner
        slotCode="MOTHERBOARD"
        diagnostic={{
          status: 'ERROR',
          error_count: 2,
          warning_count: 1,
          info_count: 0,
          violation_rule_ids: ['r1', 'r2', 'r3'],
        }}
        errors={errors.slice(0, 2)}
        warnings={[errors[2]]}
        onViewAllInSidebar={onViewAll}
        renderQuickFix={(violation) => (
          <button type="button" data-testid={`quick-fix-${violation.rule_id}`}>
            Sửa nhanh {violation.rule_id}
          </button>
        )}
      />
    );

    expect(screen.getByText('Lỗi 1 trên Mainboard')).toBeInTheDocument();
    expect(screen.getByText('Lỗi 2 trên Mainboard')).toBeInTheDocument();
    expect(screen.queryByText('Cảnh báo 3 trên Mainboard')).toBeNull();
    expect(screen.getByTestId('quick-fix-r1')).toBeInTheDocument();
    expect(screen.getByTestId('quick-fix-r2')).toBeInTheDocument();

    const viewAllBtn = screen.getByRole('button', {
      name: /Xem tất cả trong Sidebar/i,
    });
    fireEvent.click(viewAllBtn);
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('TC-UC2-13: Click thẻ WARNING có target_product.category_code="PSU" gọi onFocusSlot("PSU"), chạy scrollIntoView và highlight 1500ms', () => {
    const evalData = makeDiagnosticsEvaluation();
    const onFocusSlot = vi.fn();

    const { unmount } = render(
      <RuleDiagnosticsSidebar
        evaluation={evalData}
        selectedItems={[{ product_id: 'psu-550', quantity: 1, slot_code: 'PSU' }]}
        onFocusSlot={onFocusSlot}
      />
    );

    fireEvent.click(screen.getByTestId('diagnostic-card-WARNING'));
    expect(onFocusSlot).toHaveBeenCalledWith('PSU');
    unmount();

    // Tích hợp đầy đủ với PCBuilderPage: scrollIntoView & clear highlight sau 1500ms
    vi.useFakeTimers();
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    const psuProduct = makeProduct({
      product_id: 'psu-550',
      name: 'MSI MAG A550BN 550W',
      category_code: 'PSU',
      price: 1_090_000,
    });

    usePCBuilderStore.setState((state) => ({
      coreSlots: {
        ...state.coreSlots,
        PSU: [{ product: psuProduct, quantity: 1 }],
      },
      evaluation: evalData,
      highlightedSlotCode: null,
    }));

    render(
      <MemoryRouter>
        <PCBuilderPage />
      </MemoryRouter>
    );

    const psuRow = document.getElementById('builder-slot-PSU');
    expect(psuRow).not.toBeNull();
    expect(psuRow?.className).not.toContain('animate-pulse');

    fireEvent.click(screen.getByTestId('diagnostic-card-WARNING'));

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(document.getElementById('builder-slot-PSU')?.className).toContain(
      'ring-2'
    );
    expect(document.getElementById('builder-slot-PSU')?.className).toContain(
      'animate-pulse'
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(document.getElementById('builder-slot-PSU')?.className).not.toContain(
      'animate-pulse'
    );
  });

  it('TC-UC2-14: Click "Hỏi AI Tư vấn Cấu hình" phát CustomEvent smartpc:ask-ai-build đúng schema, mở AIChatWidget và gọi aiChatService.sendMessage', async () => {
    const evalData = makeDiagnosticsEvaluation();
    const dispatchedEvents: AskAIBuildEventDetail[] = [];
    const listener = (e: Event) => {
      dispatchedEvents.push((e as CustomEvent<AskAIBuildEventDetail>).detail);
    };
    window.addEventListener('smartpc:ask-ai-build', listener);

    const sendMessageSpy = vi
      .spyOn(aiChatService, 'sendMessage')
      .mockResolvedValue({
        reply: 'Bạn nên đổi sang Mainboard B760M để khớp Socket LGA1700 của i9-14900K.',
        suggestions: ['Xem Mainboard B760M phù hợp'],
        is_fallback: false,
      });

    try {
      render(
        <div>
          <RuleDiagnosticsSidebar
            evaluation={evalData}
            selectedItems={[
              { product_id: 'cpu-14900k', quantity: 1, slot_code: 'CPU' },
              { product_id: 'mb-b650', quantity: 1, slot_code: 'MOTHERBOARD' },
            ]}
            selectedItemsDetails={[
              {
                slot_code: 'CPU',
                product_id: 'cpu-14900k',
                name: 'Intel Core i9-14900K',
                quantity: 1,
                price: 14_500_000,
              },
              {
                slot_code: 'MOTHERBOARD',
                product_id: 'mb-b650',
                name: 'MSI MAG B650 TOMAHAWK WIFI',
                quantity: 1,
                price: 5_900_000,
              },
            ]}
            onFocusSlot={vi.fn()}
          />
          <AIChatWidget />
        </div>
      );

      const askBtn = screen.getByRole('button', {
        name: /Hỏi AI Tư vấn Cấu hình/i,
      });
      fireEvent.click(askBtn);

      expect(dispatchedEvents).toHaveLength(1);
      const detail = dispatchedEvents[0];
      expect(detail.auto_send).toBe(true);
      expect(detail.build_items).toHaveLength(2);
      expect(detail.build_items[0]).toEqual({
        slot_code: 'CPU',
        product_id: 'cpu-14900k',
        name: 'Intel Core i9-14900K',
        quantity: 1,
      });
      expect(detail.prompt).toContain('Intel Core i9-14900K');
      expect(detail.prompt).toContain('MSI MAG B650 TOMAHAWK WIFI');
      expect(detail.prompt).toContain('1 LỖI');
      expect(detail.prompt).toContain('1 CẢNH BÁO');

      await waitFor(() => {
        expect(sendMessageSpy).toHaveBeenCalledTimes(1);
      });
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: detail.prompt,
        })
      );

      // AIChatWidget mở drawer & hiển thị phản hồi của AI
      expect(
        screen.getByRole('heading', { name: 'Chuyên gia AI SmartPC' })
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(
          screen.getByText(/Bạn nên đổi sang Mainboard B760M/i)
        ).toBeInTheDocument();
      });
    } finally {
      window.removeEventListener('smartpc:ask-ai-build', listener);
    }
  });
});
