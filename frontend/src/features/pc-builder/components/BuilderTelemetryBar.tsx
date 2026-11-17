import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Info,
  Loader2,
  ShieldCheck,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  BuildTelemetryDTO,
  CompatibilityResult,
} from '@/features/pc-builder/types/builder.types';

export interface BuilderTelemetryBarProps {
  telemetry: BuildTelemetryDTO | null | undefined;
  compatibility: CompatibilityResult | null | undefined;
  isEvaluating: boolean;
  isOfflineMock?: boolean;
  localTotalPrice?: number;
  selectedCoreSlotsFallback?: number;
  totalCoreSlotsFallback?: number;
}

interface PsuLoadTone {
  barClass: string;
  textClass: string;
  badgeClass: string;
  label: string;
}

const formatVnd = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;

function getPsuLoadTone(loadPercent: number): PsuLoadTone {
  if (loadPercent > 90) {
    return {
      barClass: 'bg-smart-red',
      textClass: 'text-smart-red',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      label: 'Quá tải / Nguy hiểm',
    };
  }
  if (loadPercent > 75) {
    return {
      barClass: 'bg-amber-500',
      textClass: 'text-amber-700',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      label: 'Tải cao',
    };
  }
  return {
    barClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'An toàn',
  };
}

export const BuilderTelemetryBar: React.FC<BuilderTelemetryBarProps> = ({
  telemetry,
  compatibility,
  isEvaluating,
  isOfflineMock = false,
  localTotalPrice = 0,
  selectedCoreSlotsFallback = 0,
  totalCoreSlotsFallback = 8,
}) => {
  const totalPrice = telemetry?.total_price ?? localTotalPrice;
  const selectedCoreSlots =
    telemetry?.selected_core_slots ?? selectedCoreSlotsFallback;
  const totalCoreSlots = telemetry?.total_core_slots ?? totalCoreSlotsFallback;

  const estimatedTdpW = telemetry?.estimated_tdp_w ?? 0;
  const recommendedPsuW = telemetry?.recommended_psu_w ?? 0;
  const selectedPsuWattageW = telemetry?.selected_psu_wattage_w ?? null;
  const computedPsuLoadPercent =
    telemetry?.psu_load_percent ??
    (selectedPsuWattageW && selectedPsuWattageW > 0
      ? Math.round((estimatedTdpW / selectedPsuWattageW) * 1000) / 10
      : null);

  const errorsCount = compatibility?.errors?.length ?? 0;
  const warningsCount = compatibility?.warnings?.length ?? 0;
  const infoCount = compatibility?.info?.length ?? 0;
  const hasAnyEvaluation = Boolean(telemetry || compatibility);

  const balanceIndex = telemetry?.balance_index ?? null;
  const balanceLabel = telemetry?.balance_label || 'CHƯA ĐỦ DỮ LIỆU';
  const psuTone =
    computedPsuLoadPercent !== null
      ? getPsuLoadTone(computedPsuLoadPercent)
      : null;

  return (
    <div
      data-testid="builder-telemetry-bar"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
    >
      {/* Card 1: Tổng chi phí */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tổng chi phí tạm tính
          </span>
          <span className="w-7 h-7 rounded-lg bg-blue-50 text-smart-blue flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4" />
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-2 min-h-[28px]">
          <span
            data-testid="telemetry-total-price"
            className="text-lg font-black text-smart-blue tabular-nums"
          >
            {formatVnd(totalPrice)}
          </span>
          {isEvaluating && (
            <Loader2
              data-testid="telemetry-evaluating-spinner"
              className="w-4 h-4 text-smart-blue animate-spin flex-shrink-0"
              aria-label="Đang đánh giá cấu hình"
            />
          )}
        </div>

        <div className="text-xs text-slate-500 mt-1.5">
          <span className="font-semibold text-smart-navy">
            {selectedCoreSlots}/{totalCoreSlots}
          </span>{' '}
          linh kiện cốt lõi
        </div>
      </div>

      {/* Card 2: Công suất & Nguồn (TDP & PSU Load) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Công suất & Nguồn (TDP)
          </span>
          <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4" />
          </span>
        </div>

        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <span
            data-testid="telemetry-estimated-tdp"
            className="text-lg font-black text-smart-navy tabular-nums"
          >
            {estimatedTdpW} W
          </span>
          {selectedPsuWattageW !== null && computedPsuLoadPercent !== null && psuTone && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${psuTone.badgeClass}`}
            >
              {computedPsuLoadPercent}% tải ({selectedPsuWattageW}W)
            </span>
          )}
        </div>

        <div className="mt-2">
          {selectedPsuWattageW !== null && computedPsuLoadPercent !== null && psuTone ? (
            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  data-testid="psu-load-progress-bar"
                  className={`h-full rounded-full transition-all duration-300 ${psuTone.barClass}`}
                  style={{
                    width: `${Math.min(100, Math.max(0, computedPsuLoadPercent))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-semibold ${psuTone.textClass}`}>
                  {psuTone.label}
                </span>
                {recommendedPsuW > 0 && (
                  <span className="text-slate-500">
                    Khuyến nghị: ≥ {recommendedPsuW}W
                  </span>
                )}
              </div>
            </div>
          ) : recommendedPsuW > 0 ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold">
              PSU khuyến nghị: ≥ {recommendedPsuW}W
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Chọn linh kiện để ước lượng nguồn
            </span>
          )}
        </div>
      </div>

      {/* Card 3: Trạng thái Rule Engine */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Trạng thái Rule Engine
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {telemetry?.evaluation_time_ms !== undefined && (
              <span
                data-testid="evaluation-time-badge"
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold tabular-nums"
              >
                {telemetry.evaluation_time_ms}ms
              </span>
            )}
            {isOfflineMock && (
              <span
                data-testid="offline-mock-badge"
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold"
              >
                Chế độ Offline Mock
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {!hasAnyEvaluation ||
          (selectedCoreSlots === 0 &&
            errorsCount === 0 &&
            warningsCount === 0 &&
            infoCount === 0) ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Chưa có linh kiện để kiểm tra
            </span>
          ) : errorsCount === 0 && warningsCount === 0 ? (
            <>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Tương thích
              </span>
              {infoCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-smart-blue border border-blue-200 text-[11px] font-bold">
                  <Info className="w-3 h-3" />
                  {infoCount} Lưu ý
                </span>
              )}
            </>
          ) : (
            <>
              {errorsCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-smart-red border border-red-200 text-xs font-extrabold">
                  <XCircle className="w-3.5 h-3.5" />
                  {errorsCount} Lỗi
                </span>
              )}
              {warningsCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {warningsCount} Cảnh báo
                </span>
              )}
              {infoCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-smart-blue border border-blue-200 text-[11px] font-bold">
                  <Info className="w-3 h-3" />
                  {infoCount} Lưu ý
                </span>
              )}
            </>
          )}
        </div>

        <div className="text-[11px] text-slate-500 mt-1.5">
          Đối soát tự động qua Rule Engine UC6
        </div>
      </div>

      {/* Card 4: Chỉ số Cân bằng */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Chỉ số cân bằng
            </span>
            <span
              title="Ước lượng nhanh dựa trên benchmark_score của CPU/GPU; phân tích nghẽn cổ chai theo từng tựa game sẽ có tại PC Profile (UC3)"
              aria-label="Ước lượng nhanh dựa trên benchmark_score của CPU/GPU; phân tích nghẽn cổ chai theo từng tựa game sẽ có tại PC Profile (UC3)"
              className="text-slate-400 hover:text-smart-blue cursor-help inline-flex items-center"
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
          <span className="w-7 h-7 rounded-lg bg-slate-100 text-smart-navy flex items-center justify-center flex-shrink-0">
            <Gauge className="w-4 h-4" />
          </span>
        </div>

        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <span
            data-testid="telemetry-balance-index"
            className="text-lg font-black text-smart-navy tabular-nums"
          >
            {balanceIndex !== null ? `${balanceIndex}/100` : '—'}
          </span>
          <span
            className={`text-[11px] font-bold ${
              balanceIndex === null
                ? 'text-slate-400'
                : balanceIndex >= 60
                  ? 'text-smart-blue'
                  : 'text-amber-700'
            }`}
          >
            {balanceLabel}
          </span>
        </div>

        <div className="mt-2">
          {balanceIndex !== null ? (
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                data-testid="balance-progress-bar"
                className={`h-full rounded-full transition-all duration-300 ${
                  balanceIndex >= 60 ? 'bg-smart-blue' : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, balanceIndex))}%`,
                }}
              />
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">
              Chọn CPU & GPU để chấm điểm cân bằng
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
