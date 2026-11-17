import React, { useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Printer,
  ShieldCheck,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  BuilderGateStatus,
  BuilderSlotCode,
  PCBuilderEvaluateResponse,
  PeripheralSlotCode,
  SelectedSlotItem,
} from '@/features/pc-builder/types/builder.types';
import {
  CORE_SLOT_CONFIGS,
  PERIPHERAL_SLOT_CONFIGS,
} from '@/features/pc-builder/constants/slotConfig';

export interface BuilderPrintSheetModalProps {
  isOpen: boolean;
  coreSlots: Record<BuilderSlotCode, SelectedSlotItem[]>;
  peripherals: Record<PeripheralSlotCode, SelectedSlotItem[]>;
  evaluation: PCBuilderEvaluateResponse | null;
  onClose: () => void;
}

const formatVnd = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;

function resolveCompatBadge(
  gateStatus: BuilderGateStatus | undefined,
  errorCount: number,
  warningCount: number
) {
  if (gateStatus === 'READY_SAFE') {
    return {
      label: 'Đạt chuẩn Tương thích 100% (SmartPC Rule Engine)',
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Icon: CheckCircle2,
    };
  }
  if (gateStatus === 'WARNING_CONFIRM_REQUIRED') {
    return {
      label: `Tương thích kèm ${Math.max(1, warningCount)} cảnh báo kỹ thuật`,
      className: 'bg-amber-50 text-amber-800 border-amber-200',
      Icon: AlertTriangle,
    };
  }
  if (gateStatus === 'BLOCKED_COMPATIBILITY_ERROR') {
    return {
      label: `Cần xử lý ${Math.max(1, errorCount)} xung đột phần cứng`,
      className: 'bg-red-50 text-smart-red border-red-200',
      Icon: XCircle,
    };
  }
  if (gateStatus === 'BLOCKED_OUT_OF_STOCK') {
    return {
      label: 'Có linh kiện hết hàng / vượt tồn kho',
      className: 'bg-red-50 text-smart-red border-red-200',
      Icon: AlertTriangle,
    };
  }
  return {
    label: 'Chưa đánh giá tương thích',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    Icon: ShieldCheck,
  };
}

export const BuilderPrintSheetModal: React.FC<BuilderPrintSheetModalProps> = ({
  isOpen,
  coreSlots,
  peripherals,
  evaluation,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const rows: Array<{
    slotLabel: string;
    productName: string;
    brand: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];

  for (const slot of CORE_SLOT_CONFIGS) {
    const items = coreSlots[slot.slot_code as BuilderSlotCode] || [];
    for (const item of items) {
      rows.push({
        slotLabel: slot.short_name,
        productName: item.product.name,
        brand: item.product.brand,
        quantity: item.quantity,
        unitPrice: item.product.price,
        lineTotal: item.product.price * item.quantity,
      });
    }
  }

  for (const slot of PERIPHERAL_SLOT_CONFIGS) {
    const items = peripherals[slot.slot_code as PeripheralSlotCode] || [];
    for (const item of items) {
      rows.push({
        slotLabel: slot.short_name,
        productName: item.product.name,
        brand: item.product.brand,
        quantity: item.quantity,
        unitPrice: item.product.price,
        lineTotal: item.product.price * item.quantity,
      });
    }
  }

  const localTotal = rows.reduce((sum, r) => sum + r.lineTotal, 0);
  const displayTotal = evaluation?.telemetry?.total_price ?? localTotal;
  const totalQty = rows.reduce((sum, r) => sum + r.quantity, 0);
  const estimatedTdpW = evaluation?.telemetry?.estimated_tdp_w ?? 0;
  const recommendedPsuW = evaluation?.telemetry?.recommended_psu_w ?? 0;
  const errorCount = evaluation?.compatibility?.errors?.length ?? 0;
  const warningCount = evaluation?.compatibility?.warnings?.length ?? 0;
  const compatBadge = resolveCompatBadge(
    evaluation?.gate_status,
    errorCount,
    warningCount
  );
  const CompatIcon = compatBadge.Icon;
  const printedAt = new Date().toLocaleString('vi-VN');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="builder-print-sheet-title"
      data-testid="builder-print-sheet-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #smartpc-print-sheet,
          #smartpc-print-sheet * {
            visibility: visible !important;
          }
          #smartpc-print-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 20px !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="smartpc-print-sheet"
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl"
      >
        {/* Top Action Bar (hidden when printing) */}
        <div className="no-print px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-smart-blue" />
            <span className="text-sm font-extrabold text-smart-navy">
              Xem trước Bảng Báo Giá Cấu Hình PC (Chuẩn A4)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="print-sheet-trigger-btn"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-smart-blue hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In bảng báo giá</span>
            </button>

            <button
              type="button"
              data-testid="print-sheet-close-btn"
              onClick={onClose}
              aria-label="Đóng bảng báo giá"
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable A4 Sheet Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Quotation Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-smart-blue p-2.5 rounded-xl text-white flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight text-smart-navy">
                  Smart<span className="text-smart-blue">PC</span> Vietnam
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Hotline tư vấn: 1900 8899 • Bảo hành chính hãng 36 tháng
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <h2
                id="builder-print-sheet-title"
                className="text-base sm:text-lg font-black text-smart-navy uppercase tracking-wide"
              >
                Bảng Báo Giá Cấu Hình PC
              </h2>
              <p className="text-xs text-slate-500">
                Ngày lập: <strong className="text-slate-700">{printedAt}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Số lượng linh kiện: <strong className="text-slate-700">{totalQty} món</strong>
              </p>
            </div>
          </div>

          {/* Compatibility & Power Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className={`rounded-xl border px-4 py-3 flex items-center gap-2.5 text-xs font-bold ${compatBadge.className}`}
            >
              <CompatIcon className="w-4 h-4 flex-shrink-0" />
              <span>{compatBadge.label}</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Công suất TDP ước tính:</span>
                <strong className="text-smart-navy">{estimatedTdpW}W</strong>
              </span>
              {recommendedPsuW > 0 && (
                <span className="text-slate-600 font-semibold">
                  PSU khuyến nghị: ≥ {recommendedPsuW}W
                </span>
              )}
            </div>
          </div>

          {/* Component Line Items Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[11px] font-extrabold">
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-3 w-32">Khe linh kiện</th>
                  <th className="py-3 px-3">Tên linh kiện</th>
                  <th className="py-3 px-3 w-16 text-center">SL</th>
                  <th className="py-3 px-3 w-32 text-right">Đơn giá</th>
                  <th className="py-3 px-3 w-36 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => (
                  <tr key={`${row.slotLabel}-${idx}`} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 text-center text-slate-500 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-bold text-smart-navy whitespace-nowrap">
                      {row.slotLabel}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{row.productName}</div>
                      {row.brand && (
                        <div className="text-[11px] text-slate-500">{row.brand}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700 tabular-nums">
                      {row.quantity}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                      {formatVnd(row.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-smart-navy tabular-nums">
                      {formatVnd(row.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50/60 border-t-2 border-slate-200">
                  <td
                    colSpan={5}
                    className="py-3.5 px-4 text-right text-xs font-extrabold uppercase tracking-wider text-smart-navy"
                  >
                    Tổng chi phí dự kiến (Đã gồm VAT):
                  </td>
                  <td
                    data-testid="print-sheet-total-price"
                    className="py-3.5 px-3 text-right text-base font-black text-smart-blue tabular-nums whitespace-nowrap"
                  >
                    {formatVnd(displayTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Notes */}
          <div className="pt-2 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              * Báo giá có hiệu lực tại thời điểm xuất và được đối soát tồn kho tự động khi đặt hàng.
            </span>
            <span className="font-semibold text-slate-600">
              SmartPC AI Compatibility Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
