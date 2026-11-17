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
  CompatibilityViolation,
  PCBuilderEvaluateResponse,
} from '@/features/pc-builder/types/builder.types';
import { pcBuilderService } from '@/services/pcBuilderService';
import { usePCBuilderStore } from '@/stores/usePCBuilderStore';
import { PCBuilderPage } from '@/features/pc-builder/pages/PCBuilderPage';
import { BuilderBottomBar } from './BuilderBottomBar';
import { RiskConfirmationModal } from './RiskConfirmationModal';

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

const makeWarningViolation = (
  message = 'Tổng công suất tiêu thụ ước tính (550W) vượt quá công suất định mức nguồn (450W).'
): CompatibilityViolation => ({
  rule_id: 'r0000001-0000-0000-0000-000000000007',
  rule_name: 'PSU Wattage Sufficiency',
  severity: 'WARNING',
  message,
  source_product: null,
  target_product: {
    id: 'psu-450',
    name: 'Corsair CV450 450W',
    category_code: 'PSU',
  },
});

const makeWarningEvaluation = (
  totalPrice = 18_500_000
): PCBuilderEvaluateResponse => ({
  compatibility: {
    is_compatible: true,
    errors: [],
    warnings: [makeWarningViolation()],
    info: [],
    unresolved_product_ids: [],
  },
  telemetry: {
    total_price: totalPrice,
    estimated_tdp_w: 550,
    recommended_psu_w: 750,
    selected_psu_wattage_w: 450,
    psu_load_percent: 122.2,
    balance_index: 82,
    balance_label: 'CÂN BẰNG TỐT',
    selected_core_slots: 2,
    total_core_slots: 8,
    evaluation_time_ms: 1.9,
  },
  slot_statuses: {
    CPU: {
      status: 'COMPATIBLE',
      error_count: 0,
      warning_count: 0,
      info_count: 0,
      violation_rule_ids: [],
    },
    PSU: {
      status: 'WARNING',
      error_count: 0,
      warning_count: 1,
      info_count: 0,
      violation_rule_ids: ['r0000001-0000-0000-0000-000000000007'],
    },
  },
  gate_status: 'WARNING_CONFIRM_REQUIRED',
  stock_issues: [],
  missing_recommended_slots: ['MOTHERBOARD', 'RAM', 'SSD_M2', 'CASE'],
});

describe('RiskConfirmationModal, BuilderBottomBar & Store Auto-Reset (WBS 7.5.4)', () => {
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

  it('TC-UC2-19 (Store): Auto-reset acknowledgedWarnings về false khi thay đổi cấu hình (selectProduct, removeItem, updateQuantity, replaceSlotProduct, clearBuild, loadFromResolved)', () => {
    vi.spyOn(pcBuilderService, 'evaluateBuild').mockResolvedValue({
      success: true,
      status_code: 200,
      message: 'OK',
      data: makeWarningEvaluation(),
    });

    const gpu1 = makeProduct({
      product_id: 'gpu-4060',
      name: 'ASUS Dual RTX 4060',
      category_code: 'GPU',
      price: 8_490_000,
    });
    const gpu2 = makeProduct({
      product_id: 'gpu-4070',
      name: 'ASUS TUF RTX 4070',
      category_code: 'GPU',
      price: 16_990_000,
    });
    const ram1 = makeProduct({
      product_id: 'ram-16gb',
      name: 'Corsair Vengeance 16GB',
      category_code: 'RAM',
      price: 1_890_000,
    });

    const store = usePCBuilderStore.getState();

    // 1. selectProduct resets acknowledgedWarnings
    store.setAcknowledgedWarnings(true);
    expect(usePCBuilderStore.getState().acknowledgedWarnings).toBe(true);
    store.selectProduct('GPU', gpu1);
    expect(usePCBuilderStore.getState().acknowledgedWarnings).toBe(false);

    // 2. replaceSlotProduct resets acknowledgedWarnings
    usePCBuilderStore.getState().setAcknowledgedWarnings(true);
    usePCBuilderStore.getState().replaceSlotProduct('GPU', 'gpu-4060', gpu2);
    expect(usePCBuilderStore.getState().acknowledgedWarnings).toBe(false);

    // 3. updateQuantity resets acknowledgedWarnings
    usePCBuilderStore.getState().selectProduct('RAM', ram1);
    usePCBuilderStore.getState().setAcknowledgedWarnings(true);
    usePCBuilderStore.getState().updateQuantity('RAM', 'ram-16gb', 1);
    expect(usePCBuilderStore.getState().acknowledgedWarnings).toBe(false);

    // 4. removeItem resets acknowledgedWarnings
    usePCBuilderStore.getState().setAcknowledgedWarnings(true);
    usePCBuilderStore.getState().removeItem('RAM', 'ram-16gb');
    expect(usePCBuilderStore.getState().acknowledgedWarnings).toBe(false);

    // 5. loadFromResolved resets acknowledgedWarnings
    usePCBuilderStore.getState().setAcknowledgedWarnings(true);
    usePCBuilderStore
      .getState()
      .loadFromResolved(
        [{ slot_code: 'GPU', quantity: 1, product: gpu1 }],
        makeWarningEvaluation()
      );
    expect(usePCBuilderStore.getState().acknowledgedWarnings).toBe(false);

    // 6. clearBuild resets acknowledgedWarnings
    usePCBuilderStore.getState().setAcknowledgedWarnings(true);
    usePCBuilderStore.getState().clearBuild();
    expect(usePCBuilderStore.getState().acknowledgedWarnings).toBe(false);
  });

  it('RiskConfirmationModal: Khóa nút xác nhận khi chưa tick checkbox, reset checkbox khi mở lại và gọi onConfirm khi đã tick', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const warnings = [
      makeWarningViolation('Công suất nguồn 450W sát ngưỡng tải 550W.'),
      makeWarningViolation('Số lượng SSD M.2 vượt quá khe trực tiếp trên Mainboard.'),
    ];

    const { rerender } = render(
      <RiskConfirmationModal
        isOpen={true}
        warnings={warnings}
        totalPrice={21_500_000}
        isSubmitting={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByTestId('risk-confirmation-modal')).toBeInTheDocument();
    expect(screen.getAllByTestId('risk-warning-item')).toHaveLength(2);
    expect(screen.getByTestId('risk-modal-total-price')).toHaveTextContent(
      /21\.500\.000/
    );

    const checkbox = screen.getByTestId(
      'risk-confirmation-checkbox'
    ) as HTMLInputElement;
    const submitBtn = screen.getByTestId('risk-confirmation-submit-btn');

    expect(checkbox.checked).toBe(false);
    expect(submitBtn).toBeDisabled();

    // Tick checkbox -> bật nút xác nhận
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(submitBtn).toBeEnabled();

    // Đóng rồi mở lại modal -> checkbox phải reset về false
    rerender(
      <RiskConfirmationModal
        isOpen={false}
        warnings={warnings}
        totalPrice={21_500_000}
        isSubmitting={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    rerender(
      <RiskConfirmationModal
        isOpen={true}
        warnings={warnings}
        totalPrice={21_500_000}
        isSubmitting={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const reopenedCheckbox = screen.getByTestId(
      'risk-confirmation-checkbox'
    ) as HTMLInputElement;
    const reopenedSubmitBtn = screen.getByTestId('risk-confirmation-submit-btn');
    expect(reopenedCheckbox.checked).toBe(false);
    expect(reopenedSubmitBtn).toBeDisabled();

    // Tick lại và bấm xác nhận -> gọi onConfirm
    fireEvent.click(reopenedCheckbox);
    fireEvent.click(reopenedSubmitBtn);
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    // Bấm Hủy -> gọi onCancel
    fireEvent.click(screen.getByTestId('risk-confirmation-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('BuilderBottomBar: Hiển thị chính xác 5 trạng thái BuilderGateStatus theo đặc tả 7.5.4 §3.2', () => {
    const onAddToCart = vi.fn();
    const onOpenRiskModal = vi.fn();

    const { rerender } = render(
      <BuilderBottomBar
        gateStatus="BLOCKED_EMPTY"
        totalPrice={0}
        selectedCoreSlots={0}
        onAddToCart={onAddToCart}
        onOpenRiskModal={onOpenRiskModal}
      />
    );

    let ctaBtn = screen.getByTestId('builder-gate-cta-btn');
    expect(ctaBtn).toBeDisabled();
    expect(ctaBtn).toHaveTextContent('Chọn linh kiện để bắt đầu');

    rerender(
      <BuilderBottomBar
        gateStatus="BLOCKED_OUT_OF_STOCK"
        totalPrice={12_000_000}
        selectedCoreSlots={2}
        stockIssuesCount={1}
        onAddToCart={onAddToCart}
        onOpenRiskModal={onOpenRiskModal}
      />
    );
    ctaBtn = screen.getByTestId('builder-gate-cta-btn');
    expect(ctaBtn).toBeDisabled();
    expect(ctaBtn).toHaveTextContent('Có linh kiện vượt tồn kho');

    rerender(
      <BuilderBottomBar
        gateStatus="BLOCKED_COMPATIBILITY_ERROR"
        totalPrice={15_000_000}
        selectedCoreSlots={3}
        errorCount={2}
        onAddToCart={onAddToCart}
        onOpenRiskModal={onOpenRiskModal}
      />
    );
    ctaBtn = screen.getByTestId('builder-gate-cta-btn');
    expect(ctaBtn).toBeDisabled();
    expect(ctaBtn).toHaveTextContent('Cần sửa 2 xung đột phần cứng');
    expect(ctaBtn).toHaveAttribute('title', 'Vui lòng xử lý 2 lỗi phần cứng');

    rerender(
      <BuilderBottomBar
        gateStatus="WARNING_CONFIRM_REQUIRED"
        totalPrice={18_500_000}
        selectedCoreSlots={4}
        warningCount={1}
        onAddToCart={onAddToCart}
        onOpenRiskModal={onOpenRiskModal}
      />
    );
    ctaBtn = screen.getByTestId('builder-gate-cta-btn');
    expect(ctaBtn).toBeEnabled();
    expect(ctaBtn).toHaveTextContent('Xem cảnh báo & Thêm vào giỏ');
    fireEvent.click(ctaBtn);
    expect(onOpenRiskModal).toHaveBeenCalledTimes(1);
    expect(onAddToCart).not.toHaveBeenCalled();

    rerender(
      <BuilderBottomBar
        gateStatus="READY_SAFE"
        totalPrice={22_000_000}
        selectedCoreSlots={6}
        onAddToCart={onAddToCart}
        onOpenRiskModal={onOpenRiskModal}
      />
    );
    ctaBtn = screen.getByTestId('builder-gate-cta-btn');
    expect(ctaBtn).toBeEnabled();
    expect(ctaBtn).toHaveTextContent('Thêm trọn bộ vào giỏ hàng');
    fireEvent.click(ctaBtn);
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it('TC-UC2-19 (Page Flow): Sau khi xác nhận WARNING và đổi linh kiện trên store, lần bấm mua tiếp theo bắt buộc mở lại RiskConfirmationModal', async () => {
    const cpu = makeProduct({
      product_id: 'cpu-14900k',
      name: 'Intel Core i9-14900K',
      category_code: 'CPU',
      price: 14_500_000,
    });
    const psu = makeProduct({
      product_id: 'psu-450',
      name: 'Corsair CV450 450W',
      category_code: 'PSU',
      price: 990_000,
    });
    const newGpu = makeProduct({
      product_id: 'gpu-4070',
      name: 'ASUS Dual RTX 4070',
      category_code: 'GPU',
      price: 16_500_000,
    });

    vi.spyOn(pcBuilderService, 'evaluateBuild').mockResolvedValue({
      success: true,
      status_code: 200,
      message: 'OK',
      data: makeWarningEvaluation(31_990_000),
    });

    usePCBuilderStore.setState((state) => ({
      coreSlots: {
        ...state.coreSlots,
        CPU: [{ product: cpu, quantity: 1 }],
        PSU: [{ product: psu, quantity: 1 }],
      },
      evaluation: makeWarningEvaluation(15_490_000),
      acknowledgedWarnings: false,
    }));

    render(
      <MemoryRouter>
        <PCBuilderPage />
      </MemoryRouter>
    );

    // 1. Bấm nút hổ phách -> mở RiskConfirmationModal
    fireEvent.click(screen.getByTestId('builder-gate-cta-btn'));
    expect(screen.getByTestId('risk-confirmation-modal')).toBeInTheDocument();

    // 2. Tích checkbox và xác nhận -> acknowledgedWarnings = true
    fireEvent.click(screen.getByTestId('risk-confirmation-checkbox'));
    fireEvent.click(screen.getByTestId('risk-confirmation-submit-btn'));

    await waitFor(() => {
      expect(usePCBuilderStore.getState().acknowledgedWarnings).toBe(true);
    });
    await waitFor(() => {
      expect(screen.queryByTestId('risk-confirmation-modal')).toBeNull();
    });

    // 3. Đổi cấu hình qua selectProduct("GPU", newGpu) -> acknowledgedWarnings tự động reset về false
    act(() => {
      usePCBuilderStore.getState().selectProduct('GPU', newGpu);
    });
    expect(usePCBuilderStore.getState().acknowledgedWarnings).toBe(false);

    // 4. Lần bấm CTA tiếp theo (khi vẫn còn WARNING) phải mở lại RiskConfirmationModal với checkbox chưa tích
    fireEvent.click(screen.getByTestId('builder-gate-cta-btn'));
    const reopenedModal = screen.getByTestId('risk-confirmation-modal');
    expect(reopenedModal).toBeInTheDocument();
    expect(
      (screen.getByTestId('risk-confirmation-checkbox') as HTMLInputElement).checked
    ).toBe(false);
    expect(screen.getByTestId('risk-confirmation-submit-btn')).toBeDisabled();
  });
});
