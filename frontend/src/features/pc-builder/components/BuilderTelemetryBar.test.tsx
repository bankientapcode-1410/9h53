import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type {
  BuildTelemetryDTO,
  CompatibilityResult,
} from '@/features/pc-builder/types/builder.types';
import { BuilderTelemetryBar } from './BuilderTelemetryBar';

const baseCompatibility: CompatibilityResult = {
  is_compatible: true,
  errors: [],
  warnings: [],
  info: [],
  unresolved_product_ids: [],
};

const makeTelemetry = (
  overrides: Partial<BuildTelemetryDTO> = {}
): BuildTelemetryDTO => ({
  total_price: 25_400_000,
  estimated_tdp_w: 420,
  recommended_psu_w: 650,
  selected_psu_wattage_w: 750,
  psu_load_percent: 56,
  balance_index: 88,
  balance_label: 'CÂN BẰNG TỐT',
  selected_core_slots: 6,
  total_core_slots: 8,
  evaluation_time_ms: 1.5,
  ...overrides,
});

describe('BuilderTelemetryBar (WBS 7.5.3)', () => {
  it('TC-UC2-11: Hiển thị 620 W, thanh tải PSU màu đỏ (>90%), badge độ trễ 2ms và tổng giá VND chuẩn', () => {
    const telemetry = makeTelemetry({
      total_price: 32_500_000,
      estimated_tdp_w: 620,
      selected_psu_wattage_w: 650,
      psu_load_percent: 95.4,
      recommended_psu_w: 850,
      evaluation_time_ms: 2,
      selected_core_slots: 7,
      total_core_slots: 8,
    });

    render(
      <BuilderTelemetryBar
        telemetry={telemetry}
        compatibility={baseCompatibility}
        isEvaluating={false}
        isOfflineMock={false}
      />
    );

    expect(screen.getByTestId('telemetry-total-price')).toHaveTextContent(
      '32.500.000đ'
    );
    expect(screen.getByTestId('telemetry-estimated-tdp')).toHaveTextContent(
      '620 W'
    );
    expect(screen.getByTestId('evaluation-time-badge')).toHaveTextContent(
      '2ms'
    );

    const psuBar = screen.getByTestId('psu-load-progress-bar');
    expect(psuBar.className).toContain('bg-smart-red');
    expect(screen.getByText(/95\.4% tải \(650W\)/)).toBeInTheDocument();
    expect(screen.getByText('7/8')).toBeInTheDocument();
  });

  it('Hiển thị đúng ngưỡng màu tải PSU (<=75% xanh, 75-90% vàng) và khuyến nghị khi chưa chọn PSU', () => {
    const { rerender } = render(
      <BuilderTelemetryBar
        telemetry={makeTelemetry({
          estimated_tdp_w: 350,
          selected_psu_wattage_w: 750,
          psu_load_percent: 46.7,
        })}
        compatibility={baseCompatibility}
        isEvaluating={false}
      />
    );

    expect(screen.getByTestId('psu-load-progress-bar').className).toContain(
      'bg-emerald-500'
    );

    rerender(
      <BuilderTelemetryBar
        telemetry={makeTelemetry({
          estimated_tdp_w: 520,
          selected_psu_wattage_w: 650,
          psu_load_percent: 80,
        })}
        compatibility={baseCompatibility}
        isEvaluating={false}
      />
    );

    expect(screen.getByTestId('psu-load-progress-bar').className).toContain(
      'bg-amber-500'
    );

    rerender(
      <BuilderTelemetryBar
        telemetry={makeTelemetry({
          estimated_tdp_w: 400,
          selected_psu_wattage_w: null,
          psu_load_percent: null,
          recommended_psu_w: 600,
        })}
        compatibility={baseCompatibility}
        isEvaluating={false}
      />
    );

    expect(screen.queryByTestId('psu-load-progress-bar')).toBeNull();
    expect(screen.getByText('PSU khuyến nghị: ≥ 600W')).toBeInTheDocument();
  });

  it('Giữ nguyên tổng giá khi isEvaluating=true (CLS=0), hiển thị badge Offline Mock và tooltip Balance Index', () => {
    render(
      <BuilderTelemetryBar
        telemetry={makeTelemetry({
          total_price: 18_990_000,
          balance_index: 54,
          balance_label: 'CÓ ĐIỂM NGHẼN',
        })}
        compatibility={{
          ...baseCompatibility,
          is_compatible: false,
          errors: [
            {
              rule_id: 'r1',
              rule_name: 'Socket Match',
              severity: 'ERROR',
              message: 'Socket không khớp',
              source_product: null,
              target_product: null,
            },
          ],
          warnings: [
            {
              rule_id: 'r2',
              rule_name: 'PSU Wattage',
              severity: 'WARNING',
              message: 'Nguồn thấp',
              source_product: null,
              target_product: null,
            },
          ],
        }}
        isEvaluating={true}
        isOfflineMock={true}
      />
    );

    expect(screen.getByTestId('telemetry-total-price')).toHaveTextContent(
      '18.990.000đ'
    );
    expect(
      screen.getByTestId('telemetry-evaluating-spinner')
    ).toBeInTheDocument();
    expect(screen.getByTestId('offline-mock-badge')).toHaveTextContent(
      'Chế độ Offline Mock'
    );
    expect(screen.getByText('1 Lỗi')).toBeInTheDocument();
    expect(screen.getByText('1 Cảnh báo')).toBeInTheDocument();
    expect(screen.getByTestId('telemetry-balance-index')).toHaveTextContent(
      '54/100'
    );
    expect(screen.getByTestId('balance-progress-bar').className).toContain(
      'bg-amber-500'
    );
    expect(
      screen.getByLabelText(/phân tích nghẽn cổ chai.*PC Profile \(UC3\)/i)
    ).toBeInTheDocument();
  });
});
