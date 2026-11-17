import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Sparkles } from 'lucide-react';
import type {
  AllBuilderSlotCode,
  BuilderSlotCode,
  PeripheralSlotCode,
  SelectedSlotItem,
  SlotDiagnosticDTO,
} from '@/features/pc-builder/types/builder.types';
import {
  CORE_SLOT_CONFIGS,
  PERIPHERAL_SLOT_CONFIGS,
  TOTAL_CORE_SLOTS,
} from '@/features/pc-builder/constants/slotConfig';
import { BuilderSlotRow } from './BuilderSlotRow';

interface BuilderSlotListProps {
  coreSlots: Record<BuilderSlotCode, SelectedSlotItem[]>;
  peripherals: Record<PeripheralSlotCode, SelectedSlotItem[]>;
  slotStatuses?: Record<string, SlotDiagnosticDTO>;
  highlightedSlotCode?: string | null;
  onOpenPicker: (slotCode: AllBuilderSlotCode) => void;
  onRemoveItem: (slotCode: AllBuilderSlotCode, productId: string) => void;
  onUpdateQuantity: (slotCode: AllBuilderSlotCode, productId: string, delta: number) => void;
  renderSlotBanner?: (
    slotCode: AllBuilderSlotCode,
    diagnostic?: SlotDiagnosticDTO
  ) => React.ReactNode;
}

export const BuilderSlotList: React.FC<BuilderSlotListProps> = ({
  coreSlots,
  peripherals,
  slotStatuses,
  highlightedSlotCode,
  onOpenPicker,
  onRemoveItem,
  onUpdateQuantity,
  renderSlotBanner,
}) => {
  const selectedCoreCount = CORE_SLOT_CONFIGS.filter(
    (cfg) => cfg.is_core && (coreSlots[cfg.slot_code as BuilderSlotCode]?.length ?? 0) > 0
  ).length;

  const selectedPeripheralItemsCount = PERIPHERAL_SLOT_CONFIGS.reduce(
    (sum, cfg) =>
      sum +
      (peripherals[cfg.slot_code as PeripheralSlotCode] || []).reduce(
        (acc, item) => acc + item.quantity,
        0
      ),
    0
  );

  const [showPeripherals, setShowPeripherals] = useState(
    selectedPeripheralItemsCount > 0
  );

  useEffect(() => {
    if (selectedPeripheralItemsCount > 0) {
      setShowPeripherals(true);
    }
  }, [selectedPeripheralItemsCount]);

  return (
    <div id="builder-slot-list" className="space-y-4">
      {/* Empty Config Onboarding CTA */}
      {selectedCoreCount === 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-white to-cyan-50 border border-blue-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-smart-blue text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-smart-navy">
                Bắt đầu lắp ráp cấu hình PC chuẩn chuyên gia
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Hãy chọn <strong>Bộ vi xử lý (CPU)</strong> đầu tiên để hệ thống Rule Engine tự động kiểm tra socket, RAM, nguồn và vỏ case tương thích theo thời gian thực.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenPicker('CPU')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-smart-blue hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-sm flex-shrink-0"
          >
            <Cpu className="w-4 h-4" />
            <span>Chọn CPU ngay</span>
          </button>
        </div>
      )}

      {/* Section 1: Core Hardware Slots + Internal Optional Storage */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-smart-navy uppercase tracking-wider">
            Linh kiện cốt lõi ({selectedCoreCount}/{TOTAL_CORE_SLOTS})
          </h2>
          <span className="text-xs text-slate-500">
            Kiểm tra tương thích tự động bởi Rule Engine UC6
          </span>
        </div>

        <div className="space-y-3">
          {CORE_SLOT_CONFIGS.map((config) => {
            const slotCode = config.slot_code as BuilderSlotCode;
            return (
              <BuilderSlotRow
                key={slotCode}
                config={config}
                items={coreSlots[slotCode] || []}
                diagnostic={slotStatuses?.[slotCode]}
                isHighlighted={highlightedSlotCode === slotCode}
                onOpenPicker={onOpenPicker}
                onRemoveItem={onRemoveItem}
                onUpdateQuantity={onUpdateQuantity}
                renderViolationBanner={renderSlotBanner}
              />
            );
          })}
        </div>
      </div>

      {/* Section 2: Collapsible Optional Peripherals */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPeripherals((prev) => !prev)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm font-extrabold text-smart-navy">
              Thiết bị ngoại vi tùy chọn (Màn hình, Bàn phím, Chuột)
            </span>
            {selectedPeripheralItemsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-smart-blue border border-blue-200 text-[11px] font-bold">
                Đã chọn {selectedPeripheralItemsCount} món
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              Không tính vào tiến độ {selectedCoreCount}/{TOTAL_CORE_SLOTS} linh kiện cốt lõi
            </span>
          </div>
          {showPeripherals ? (
            <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
          )}
        </button>

        {showPeripherals && (
          <div className="p-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/40">
            {PERIPHERAL_SLOT_CONFIGS.map((config) => {
              const slotCode = config.slot_code as PeripheralSlotCode;
              return (
                <BuilderSlotRow
                  key={slotCode}
                  config={config}
                  items={peripherals[slotCode] || []}
                  isHighlighted={highlightedSlotCode === slotCode}
                  onOpenPicker={onOpenPicker}
                  onRemoveItem={onRemoveItem}
                  onUpdateQuantity={onUpdateQuantity}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
