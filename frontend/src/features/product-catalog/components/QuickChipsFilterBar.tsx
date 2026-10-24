import React from 'react';
import { RotateCcw, Check, Tag, Coins, SlidersHorizontal } from 'lucide-react';
import { FacetFilterGroupDTO } from '../types/product.types';

interface QuickChipsFilterBarProps {
  facets: FacetFilterGroupDTO[];
  activeBrands?: string[];
  activeSpecs?: Record<string, string>;
  minPrice?: number;
  maxPrice?: number;
  onToggleBrand: (brand: string) => void;
  onClearBrands?: () => void;
  onToggleSpec: (specKey: string, value: string) => void;
  onClearSpec?: (specKey: string) => void;
  onSetPriceRange: (min?: number, max?: number) => void;
  onResetFilters: () => void;
}

const DEFAULT_PRICE_OPTIONS = [
  { label: 'Dưới 5 triệu', value: '0-5000000', count: 0 },
  { label: '5 - 15 triệu', value: '5000000-15000000', count: 0 },
  { label: 'Trên 15 triệu', value: '15000000-999999999', count: 0 },
];

export const QuickChipsFilterBar: React.FC<QuickChipsFilterBarProps> = ({
  facets,
  activeBrands = [],
  activeSpecs = {},
  minPrice,
  maxPrice,
  onToggleBrand,
  onClearBrands,
  onToggleSpec,
  onClearSpec,
  onSetPriceRange,
  onResetFilters,
}) => {
  const hasActiveFilters =
    activeBrands.length > 0 ||
    Object.keys(activeSpecs).length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  // Find brand facet group
  const brandGroup = facets.find(
    (g) => g.code === 'brand' || (g as any).group_key === 'brand'
  );

  // Find price facet group
  const priceGroup = facets.find(
    (g) =>
      g.code === 'price_ranges' ||
      g.code === 'price' ||
      (g as any).group_key === 'price' ||
      (g as any).group_key === 'price_ranges'
  );

  // Other dynamic spec facets (if any)
  const otherGroups = facets.filter(
    (g) =>
      g.code !== 'brand' &&
      (g as any).group_key !== 'brand' &&
      g.code !== 'price_ranges' &&
      g.code !== 'price' &&
      (g as any).group_key !== 'price' &&
      (g as any).group_key !== 'price_ranges'
  );

  const priceOptions =
    priceGroup?.options && priceGroup.options.length > 0
      ? priceGroup.options
      : DEFAULT_PRICE_OPTIONS;

  return (
    <div className="space-y-2">
      {/* Top Bar: Title & Reset Button (No description text, ultra-compact) */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-smart-blue" />
          <span className="font-bold text-xs md:text-sm text-smart-navy">Bộ lọc nhanh</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-smart-red hover:underline font-semibold transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>

      {/* 2 Compact Boxes on the Same Row: Brand Box & Price Range Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Box 1: Thương hiệu phổ biến */}
        <div className="bg-white rounded-xl p-3 md:p-3.5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Tag className="w-3.5 h-3.5 text-smart-blue" />
              <span>
                {brandGroup?.label || (brandGroup as any)?.group_label || 'Thương hiệu phổ biến'}
              </span>
            </div>
            {activeBrands.length > 0 && (
              <span className="text-[10px] font-semibold text-smart-blue bg-blue-50 px-1.5 py-0.2 rounded-md border border-blue-200">
                {activeBrands.length} đã chọn
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (activeBrands.length > 0) {
                  if (onClearBrands) {
                    onClearBrands();
                  } else {
                    onToggleBrand('');
                  }
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                activeBrands.length === 0
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tất cả
            </button>
            {brandGroup?.options?.map((opt) => {
              const isSelected = activeBrands.some(
                (b) => b.toUpperCase() === opt.value.toUpperCase()
              );
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => onToggleBrand(opt.value)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                    isSelected
                      ? 'bg-smart-blue text-white border-smart-blue shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  <span>{opt.label}</span>
                  {opt.count > 0 && (
                    <span
                      className={`text-[10px] ml-0.5 px-1 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Box 2: Khoảng giá */}
        <div className="bg-white rounded-xl p-3 md:p-3.5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {priceGroup?.label || (priceGroup as any)?.group_label || 'Khoảng giá'}
              </span>
            </div>
            {(minPrice !== undefined || maxPrice !== undefined) && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                Đang lọc giá
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSetPriceRange(undefined, undefined)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                minPrice === undefined && maxPrice === undefined
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tất cả mức giá
            </button>
            {priceOptions.map((opt) => {
              const [minStr, maxStr] = opt.value.split('-');
              const rawMin = minStr ? Number(minStr) : 0;
              const rawMax = maxStr ? Number(maxStr) : Infinity;
              const optMin = rawMin > 0 ? rawMin : undefined;
              const optMax =
                rawMax < 999999999 && Number.isFinite(rawMax) ? rawMax : undefined;
              const isSelected =
                minPrice === optMin &&
                maxPrice === optMax &&
                (optMin !== undefined || optMax !== undefined);

              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    if (isSelected) {
                      onSetPriceRange(undefined, undefined);
                    } else {
                      onSetPriceRange(optMin, optMax);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                    isSelected
                      ? 'bg-smart-blue text-white border-smart-blue shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  <span>{opt.label}</span>
                  {opt.count > 0 && (
                    <span
                      className={`text-[10px] ml-0.5 px-1 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Additional Spec Chip Groups (if present in facets) */}
      {otherGroups.length > 0 && (
        <div className="bg-white rounded-xl p-3 md:p-3.5 shadow-xs border border-slate-200/80 space-y-2">
          {otherGroups.map((group) => {
            const currentVal = activeSpecs[group.code] || '';
            const activeValues = currentVal ? currentVal.split(',') : [];

            return (
              <div key={group.code} className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700 w-24 flex-shrink-0">
                  {group.label}:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeValues.length > 0) {
                        if (onClearSpec) {
                          onClearSpec(group.code);
                        } else {
                          onToggleSpec(group.code, '');
                        }
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                      activeValues.length === 0
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tất cả
                  </button>
                  {group.options.map((opt) => {
                    const isSelected = activeValues.includes(opt.value);
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => onToggleSpec(group.code, opt.value)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                          isSelected
                            ? 'bg-smart-blue text-white border-smart-blue shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{opt.label}</span>
                        {opt.count > 0 && (
                          <span
                            className={`text-[10px] ml-0.5 px-1 py-0.2 rounded-full ${
                              isSelected
                                ? 'bg-blue-700 text-blue-100'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {opt.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
