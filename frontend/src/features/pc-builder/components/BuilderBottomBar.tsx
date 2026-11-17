import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PackageX,
  Printer,
  Share2,
  ShoppingCart,
  Wrench,
  XCircle,
} from 'lucide-react';
import type { BuilderGateStatus } from '@/features/pc-builder/types/builder.types';

export interface BuilderBottomBarProps {
  gateStatus: BuilderGateStatus;
  totalPrice: number;
  selectedCoreSlots: number;
  totalCoreSlots?: number;
  totalItemsCount?: number;
  errorCount?: number;
  warningCount?: number;
  stockIssuesCount?: number;
  isEvaluating?: boolean;
  isSubmitting?: boolean;
  onAddToCart: () => void | Promise<void>;
  onOpenRiskModal?: () => void;
  onShareBuild?: () => void;
  onPrintQuote?: () => void;
}

interface GateCtaPresentation {
  label: string;
  tooltip: string;
  disabled: boolean;
  buttonClass: string;
  statusBadgeLabel: string;
  statusBadgeClass: string;
  Icon: React.FC<{ className?: string }>;
}

const formatVnd = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;

function resolveGatePresentation(params: {
  gateStatus: BuilderGateStatus;
  errorCount: number;
  warningCount: number;
  stockIssuesCount: number;
  isEvaluating: boolean;
  isSubmitting: boolean;
}): GateCtaPresentation {
  const {
    gateStatus,
    errorCount,
    warningCount,
    stockIssuesCount,
    isEvaluating,
    isSubmitting,
  } = params;

  switch (gateStatus) {
    case 'BLOCKED_EMPTY':
      return {
        label: 'Chọn linh kiện để bắt đầu',
        tooltip: 'Vui lòng chọn ít nhất một linh kiện để bắt đầu lắp ráp PC',
        disabled: true,
        buttonClass:
          'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed',
        statusBadgeLabel: 'Chưa chọn linh kiện',
        statusBadgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        Icon: Wrench,
      };

    case 'BLOCKED_OUT_OF_STOCK':
      return {
        label: 'Có linh kiện vượt tồn kho',
        tooltip: 'Một hoặc nhiều linh kiện đã hết hàng hoặc vượt quá tồn kho hiện có',
        disabled: true,
        buttonClass:
          'bg-smart-red/85 text-white border border-red-700/20 cursor-not-allowed opacity-75',
        statusBadgeLabel:
          stockIssuesCount > 0
            ? `${stockIssuesCount} linh kiện không đủ tồn kho`
            : 'Vượt tồn kho',
        statusBadgeClass: 'bg-red-50 text-smart-red border-red-200',
        Icon: PackageX,
      };

    case 'BLOCKED_COMPATIBILITY_ERROR': {
      const effectiveErrors = Math.max(1, errorCount);
      return {
        label: `Cần sửa ${effectiveErrors} xung đột phần cứng`,
        tooltip: `Vui lòng xử lý ${effectiveErrors} lỗi phần cứng`,
        disabled: true,
        buttonClass:
          'bg-smart-red/85 text-white border border-red-700/20 cursor-not-allowed opacity-75',
        statusBadgeLabel: `${effectiveErrors} lỗi phần cứng (ERROR)`,
        statusBadgeClass: 'bg-red-50 text-smart-red border-red-200',
        Icon: XCircle,
      };
    }

    case 'WARNING_CONFIRM_REQUIRED': {
      const effectiveWarnings = Math.max(1, warningCount);
      return {
        label: 'Xem cảnh báo & Thêm vào giỏ',
        tooltip: `Cấu hình có ${effectiveWarnings} cảnh báo kỹ thuật — nhấn để xác nhận rủi ro`,
        disabled: isEvaluating || isSubmitting,
        buttonClass:
          'bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-sm',
        statusBadgeLabel: `${effectiveWarnings} cảnh báo cần xác nhận`,
        statusBadgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        Icon: AlertTriangle,
      };
    }

    case 'READY_SAFE':
    default:
      return {
        label: 'Thêm trọn bộ vào giỏ hàng',
        tooltip: 'Cấu hình tương thích chuẩn — sẵn sàng thêm trọn bộ vào giỏ hàng',
        disabled: isEvaluating || isSubmitting,
        buttonClass:
          'bg-smart-blue hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-sm',
        statusBadgeLabel: 'Sẵn sàng đặt hàng',
        statusBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Icon: CheckCircle2,
      };
  }
}

export const BuilderBottomBar: React.FC<BuilderBottomBarProps> = ({
  gateStatus,
  totalPrice,
  selectedCoreSlots,
  totalCoreSlots = 8,
  totalItemsCount,
  errorCount = 0,
  warningCount = 0,
  stockIssuesCount = 0,
  isEvaluating = false,
  isSubmitting = false,
  onAddToCart,
  onOpenRiskModal,
  onShareBuild,
  onPrintQuote,
}) => {
  const presentation = resolveGatePresentation({
    gateStatus,
    errorCount,
    warningCount,
    stockIssuesCount,
    isEvaluating,
    isSubmitting,
  });

  const isEmpty = gateStatus === 'BLOCKED_EMPTY';
  const StatusIcon = presentation.Icon;

  const handlePrimaryClick = () => {
    if (presentation.disabled) {
      return;
    }
    if (gateStatus === 'WARNING_CONFIRM_REQUIRED') {
      if (onOpenRiskModal) {
        onOpenRiskModal();
      } else {
        void onAddToCart();
      }
      return;
    }
    void onAddToCart();
  };

  return (
    <div
      data-testid="builder-bottom-bar"
      className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
    >
      {/* Left: Build summary + Gatekeeper status badge */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="text-xs text-slate-600">
          Đã chọn{' '}
          <strong className="text-smart-navy">
            {selectedCoreSlots}/{totalCoreSlots}
          </strong>{' '}
          linh kiện cốt lõi
          {typeof totalItemsCount === 'number' && totalItemsCount > 0 && (
            <span className="text-slate-400"> ({totalItemsCount} món)</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Tổng chi phí:</span>
          <strong
            data-testid="bottom-bar-total-price"
            className="text-base font-black text-smart-blue tabular-nums"
          >
            {formatVnd(totalPrice)}
          </strong>
        </div>

        <span
          data-testid="builder-gate-status-badge"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${presentation.statusBadgeClass}`}
        >
          {isEvaluating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang đánh giá...</span>
            </>
          ) : (
            <>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{presentation.statusBadgeLabel}</span>
            </>
          )}
        </span>
      </div>

      {/* Right: Secondary utilities (Share/Print hooks for Wave 5) + Primary Gatekeeper CTA */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          data-testid="builder-share-btn"
          onClick={onShareBuild}
          disabled={!onShareBuild || isEmpty || isSubmitting}
          title={
            onShareBuild
              ? 'Sao chép liên kết chia sẻ cấu hình'
              : 'Tính năng chia sẻ cấu hình sẽ kích hoạt ở bước tích hợp giỏ hàng'
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 className="w-3.5 h-3.5 text-smart-blue" />
          <span>Chia sẻ</span>
        </button>

        <button
          type="button"
          data-testid="builder-print-btn"
          onClick={onPrintQuote}
          disabled={!onPrintQuote || isEmpty || isSubmitting}
          title={
            onPrintQuote
              ? 'Xem & in bảng báo giá cấu hình'
              : 'Tính năng xuất bảng báo giá sẽ kích hoạt ở bước tích hợp giỏ hàng'
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>In báo giá</span>
        </button>

        <button
          type="button"
          data-testid="builder-gate-cta-btn"
          data-gate-status={gateStatus}
          disabled={presentation.disabled}
          title={presentation.tooltip}
          onClick={handlePrimaryClick}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition ${presentation.buttonClass}`}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : gateStatus === 'READY_SAFE' || gateStatus === 'WARNING_CONFIRM_REQUIRED' ? (
            <ShoppingCart className="w-4 h-4" />
          ) : (
            <StatusIcon className="w-4 h-4" />
          )}
          <span>{presentation.label}</span>
        </button>
      </div>
    </div>
  );
};
