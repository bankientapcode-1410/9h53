import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { RiskConfirmationModalProps } from '@/features/pc-builder/types/builder.types';

export type { RiskConfirmationModalProps };

const formatVnd = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;

export const RiskConfirmationModal: React.FC<RiskConfirmationModalProps> = ({
  isOpen,
  warnings,
  totalPrice,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  const [isChecked, setIsChecked] = useState(false);

  // Luôn reset checkbox về false mỗi khi mở modal mới (WBS 7.5.4 §3.3)
  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
    }
  }, [isOpen]);

  // Đóng modal bằng phím Escape khi không đang gửi request
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) {
    return null;
  }

  const handleConfirmClick = async () => {
    if (!isChecked || isSubmitting) {
      return;
    }
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-confirmation-modal-title"
      data-testid="risk-confirmation-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white border border-amber-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200/80 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="risk-confirmation-modal-title"
                className="text-base sm:text-lg font-black text-smart-navy leading-snug"
              >
                Xác nhận rủi ro kỹ thuật (WARNING)
              </h2>
              <p className="text-xs text-amber-900/90 mt-0.5">
                Cấu hình của bạn không có lỗi xung đột cứng, nhưng có{' '}
                <strong>{warnings.length}</strong> cảnh báo cần lưu ý trước khi thêm vào giỏ hàng.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại xác nhận rủi ro"
            className="p-1.5 rounded-lg text-slate-500 hover:text-smart-navy hover:bg-amber-100/70 disabled:opacity-50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="space-y-2.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
              Danh sách cảnh báo từ Rule Engine ({warnings.length})
            </div>

            {warnings.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
                Cấu hình có cảnh báo kỹ thuật ở mức cần xác nhận trước khi đặt hàng.
              </div>
            ) : (
              <ul className="space-y-2">
                {warnings.map((warning, index) => {
                  const affected = [
                    warning.source_product?.category_code,
                    warning.target_product?.category_code,
                  ]
                    .filter(Boolean)
                    .join(' ↔ ');

                  return (
                    <li
                      key={`${warning.rule_id ?? warning.rule_name}-${index}`}
                      data-testid="risk-warning-item"
                      className="rounded-xl border border-amber-300 bg-amber-50/70 p-3.5 text-amber-950 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>{warning.rule_name || 'Cảnh báo tương thích'}</span>
                        </span>
                        {affected && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-200 text-[10px] font-bold text-amber-900 flex-shrink-0">
                            {affected}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-amber-900">
                        {warning.message}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Total price summary */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-600">
              Tổng giá trị cấu hình dự kiến
            </span>
            <span
              data-testid="risk-modal-total-price"
              className="text-base font-black text-smart-blue tabular-nums"
            >
              {formatVnd(totalPrice)}
            </span>
          </div>

          {/* Mandatory Risk Acknowledgement Checkbox */}
          <label
            htmlFor="risk-confirmation-checkbox"
            className="flex items-start gap-3 rounded-xl border border-slate-200 hover:border-amber-300 bg-white p-3.5 cursor-pointer transition select-none"
          >
            <input
              id="risk-confirmation-checkbox"
              data-testid="risk-confirmation-checkbox"
              type="checkbox"
              checked={isChecked}
              disabled={isSubmitting}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700 leading-relaxed">
              Tôi đã đọc kỹ các cảnh báo kỹ thuật nêu trên, chấp nhận rủi ro tương thích/hiệu năng
              và đồng ý tiếp tục thêm cấu hình này vào giỏ hàng.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            data-testid="risk-confirmation-cancel-btn"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition disabled:opacity-50"
          >
            Quay lại chỉnh sửa
          </button>

          <button
            type="button"
            data-testid="risk-confirmation-submit-btn"
            onClick={() => void handleConfirmClick()}
            disabled={!isChecked || isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-extrabold transition shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận &amp; Thêm vào giỏ hàng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
