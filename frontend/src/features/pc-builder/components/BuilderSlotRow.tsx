import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Cpu,
  Database,
  Fan,
  HardDrive,
  Info,
  Keyboard,
  Layers,
  Minus,
  Monitor,
  Mouse,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  AllBuilderSlotCode,
  SelectedSlotItem,
  SlotDiagnosticDTO,
  SlotMetadata,
  SlotStatusLevel,
} from '@/features/pc-builder/types/builder.types';
import { getProductImageFallback } from '@/utils/productImageFallback';

interface BuilderSlotRowProps {
  config: SlotMetadata;
  items: SelectedSlotItem[];
  diagnostic?: SlotDiagnosticDTO;
  isHighlighted?: boolean;
  onOpenPicker: (slotCode: AllBuilderSlotCode) => void;
  onRemoveItem: (slotCode: AllBuilderSlotCode, productId: string) => void;
  onUpdateQuantity: (slotCode: AllBuilderSlotCode, productId: string, delta: number) => void;
  renderViolationBanner?: (
    slotCode: AllBuilderSlotCode,
    diagnostic?: SlotDiagnosticDTO
  ) => React.ReactNode;
}

const formatVnd = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;

const formatSpecValue = (
  val: unknown,
  unit?: string
): string | null => {
  if (val === undefined || val === null || val === '') return null;
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    return val.join(', ');
  }
  if (typeof val === 'boolean') {
    return val ? 'Có' : 'Không';
  }
  return unit ? `${val} ${unit}` : String(val);
};

function renderSlotIcon(slotCode: AllBuilderSlotCode) {
  const iconClass = 'w-4 h-4';
  switch (slotCode) {
    case 'CPU':
      return <Cpu className={iconClass} />;
    case 'MOTHERBOARD':
      return <Layers className={iconClass} />;
    case 'RAM':
      return <Database className={iconClass} />;
    case 'GPU':
      return <Monitor className={iconClass} />;
    case 'SSD_M2':
    case 'SSD_SATA':
      return <HardDrive className={iconClass} />;
    case 'PSU':
      return <Zap className={iconClass} />;
    case 'CASE':
      return <Box className={iconClass} />;
    case 'CPU_COOLER':
      return <Fan className={iconClass} />;
    case 'MONITOR':
      return <Monitor className={iconClass} />;
    case 'KEYBOARD':
      return <Keyboard className={iconClass} />;
    case 'MOUSE':
      return <Mouse className={iconClass} />;
    default:
      return <Cpu className={iconClass} />;
  }
}

function getRequiredBadgeClass(hint: SlotMetadata['required_hint']): string {
  if (hint === 'Bắt buộc') {
    return 'bg-blue-50 text-smart-blue border-blue-200';
  }
  if (hint === 'Khuyến nghị') {
    return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  }
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function getContainerToneClass(
  status: SlotStatusLevel,
  hasItems: boolean,
  isHighlighted: boolean
): string {
  const highlightRing = isHighlighted
    ? status === 'ERROR'
      ? 'ring-2 ring-smart-red animate-pulse'
      : status === 'WARNING'
        ? 'ring-2 ring-amber-400 animate-pulse'
        : 'ring-2 ring-smart-blue animate-pulse'
    : '';

  if (!hasItems) {
    return `border-dashed border-slate-300 bg-white hover:border-smart-blue/60 ${highlightRing}`;
  }

  switch (status) {
    case 'ERROR':
      return `border-smart-red/70 bg-red-50/30 ${highlightRing}`;
    case 'WARNING':
      return `border-amber-400 bg-amber-50/25 ${highlightRing}`;
    case 'INFO':
      return `border-blue-300 bg-blue-50/20 ${highlightRing}`;
    case 'COMPATIBLE':
    default:
      return `border-emerald-300/90 bg-white ${highlightRing}`;
  }
}

function renderStatusBadge(status: SlotStatusLevel, hasItems: boolean) {
  if (!hasItems) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
        Chưa chọn
      </span>
    );
  }

  switch (status) {
    case 'ERROR':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3" />
          Xung đột
        </span>
      );
    case 'WARNING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          Cảnh báo
        </span>
      );
    case 'INFO':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-smart-blue border border-blue-200">
          <Info className="w-3 h-3" />
          Lưu ý
        </span>
      );
    case 'COMPATIBLE':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          Tương thích
        </span>
      );
  }
}

export const BuilderSlotRow: React.FC<BuilderSlotRowProps> = ({
  config,
  items,
  diagnostic,
  isHighlighted = false,
  onOpenPicker,
  onRemoveItem,
  onUpdateQuantity,
  renderViolationBanner,
}) => {
  const hasItems = items.length > 0;
  const effectiveStatus: SlotStatusLevel = hasItems
    ? diagnostic?.status && diagnostic.status !== 'EMPTY'
      ? diagnostic.status
      : 'COMPATIBLE'
    : 'EMPTY';

  const totalSlotQty = items.reduce((sum, it) => sum + it.quantity, 0);
  const canAddMore =
    config.selection_mode === 'MULTI' && totalSlotQty < config.max_total_qty;

  return (
    <div
      id={`builder-slot-${config.slot_code}`}
      data-slot-code={config.slot_code}
      className={`rounded-2xl border p-4 transition-all duration-200 shadow-sm ${getContainerToneClass(
        effectiveStatus,
        hasItems,
        isHighlighted
      )}`}
    >
      {/* Row Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-smart-navy flex items-center justify-center border border-slate-200/80">
            {renderSlotIcon(config.slot_code)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-smart-navy">
                {config.display_name}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRequiredBadgeClass(
                  config.required_hint
                )}`}
              >
                {config.required_hint}
              </span>
              {config.selection_mode === 'MULTI' && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Đa khe ({totalSlotQty}/{config.max_total_qty})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {renderStatusBadge(effectiveStatus, hasItems)}
        </div>
      </div>

      {/* Row Body */}
      {!hasItems ? (
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500">{config.empty_hint}</p>
          <button
            type="button"
            onClick={() => onOpenPicker(config.slot_code)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-smart-blue text-smart-blue hover:text-white border border-blue-200 text-xs font-bold transition shadow-sm flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{config.cta_label}</span>
          </button>
        </div>
      ) : (
        <div className="pt-3 space-y-3">
          {items.map((item) => {
            const { product, quantity } = item;
            const lineTotal = product.price * quantity;
            const specTags = config.highlight_specs
              .map((spec) => {
                const formatted = formatSpecValue(
                  product.key_specs?.[spec.key],
                  spec.unit
                );
                return formatted ? { label: spec.label, value: formatted } : null;
              })
              .filter((x): x is { label: string; value: string } => x !== null);

            return (
              <div
                key={product.product_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50/80 border border-slate-200/80 p-3"
              >
                {/* Left: Image & Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <Link
                    to={`/products/${product.product_id}`}
                    className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center flex-shrink-0 overflow-hidden"
                  >
                    <img
                      src={
                        product.image_url ||
                        getProductImageFallback(product.category_code)
                      }
                      alt={product.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          getProductImageFallback(product.category_code);
                      }}
                    />
                  </Link>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        {product.brand}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          product.in_stock
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-smart-red border border-red-200'
                        }`}
                      >
                        {product.in_stock ? 'Còn hàng' : 'Hết hàng'}
                      </span>
                    </div>

                    <Link
                      to={`/products/${product.product_id}`}
                      className="block text-sm font-bold text-slate-800 hover:text-smart-blue transition line-clamp-2 leading-snug"
                    >
                      {product.name}
                    </Link>

                    {specTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {specTags.map((tag) => (
                          <span
                            key={tag.label}
                            className="inline-flex items-center gap-1 text-[11px] bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                          >
                            <span className="text-slate-400 font-medium">
                              {tag.label}:
                            </span>
                            <span className="font-semibold">{tag.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Price, Stepper & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-black text-smart-blue">
                      {formatVnd(lineTotal)}
                    </div>
                    {quantity > 1 && (
                      <div className="text-[11px] text-slate-500">
                        {formatVnd(product.price)} × {quantity}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {config.selection_mode === 'MULTI' && (
                      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              config.slot_code,
                              product.product_id,
                              -1
                            )
                          }
                          aria-label={`Giảm số lượng ${product.name}`}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-smart-navy transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span
                          data-testid={`qty-${config.slot_code}-${product.product_id}`}
                          className="px-2.5 text-xs font-extrabold text-smart-navy min-w-[2rem] text-center"
                        >
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              config.slot_code,
                              product.product_id,
                              1
                            )
                          }
                          disabled={totalSlotQty >= config.max_total_qty}
                          aria-label={`Tăng số lượng ${product.name}`}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-smart-navy disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {config.selection_mode === 'SINGLE' && (
                      <button
                        type="button"
                        onClick={() => onOpenPicker(config.slot_code)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-smart-blue border border-blue-200 text-xs font-bold transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Đổi</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onRemoveItem(config.slot_code, product.product_id)
                      }
                      aria-label={`Xóa ${product.name}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-500 hover:text-smart-red border border-slate-200 hover:border-red-200 text-xs font-semibold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {config.selection_mode === 'MULTI' && canAddMore && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onOpenPicker(config.slot_code)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-smart-blue text-smart-blue hover:text-white border border-blue-200 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm {config.short_name}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hook for Wave 3 SlotViolationBanner & Wave 5 QuickFixPanel */}
      {renderViolationBanner && renderViolationBanner(config.slot_code, diagnostic)}
    </div>
  );
};
