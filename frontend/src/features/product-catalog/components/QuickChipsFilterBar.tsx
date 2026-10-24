import React from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { FacetFilterGroupDTO } from '../types/product.types';

interface QuickChipsFilterBarProps {
  facets: FacetFilterGroupDTO[];
  activeBrands?: string[];
  activeSpecs?: Record<string, string>;
  minPrice?: number;
  maxPrice?: number;
  onToggleBrand: (brand: string) => void;
  onToggleSpec: (specKey: string, value: string) => void;
  onSetPriceRange: (min?: number, max?: number) => void;
  onResetFilters: () => void;
}

export const QuickChipsFilterBar: React.FC<QuickChipsFilterBarProps> = ({
  facets,
  activeBrands = [],
  activeSpecs = {},
  minPrice,
  maxPrice,
  onToggleBrand,
  onToggleSpec,
  onSetPriceRange,
  onResetFilters,
}) => {
  const hasActiveFilters =
    activeBrands.length > 0 ||
    Object.keys(activeSpecs).length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200/80 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm text-smart-navy">Bộ lọc nhanh (Quick Chips)</span>
          <span className="text-xs text-slate-400">| Cùng nhóm: OR • Khác nhóm: AND</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-xs text-smart-red hover:underline font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        {facets.map((group) => {
          if (group.code === 'brand') {
            return (
              <div key={group.code} className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 w-24 flex-shrink-0">
                  {group.label}:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (activeBrands.length > 0) {
                        activeBrands.forEach((b) => onToggleBrand(b));
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition border ${
                      activeBrands.length === 0
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tất cả
                  </button>
                  {group.options.map((opt) => {
                    const isSelected = activeBrands.some(
                      (b) => b.toUpperCase() === opt.value.toUpperCase()
                    );
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onToggleBrand(opt.value)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition border ${
                          isSelected
                            ? 'bg-smart-blue text-white border-smart-blue shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{opt.label}</span>
                        {opt.count > 0 && (
                          <span
                            className={`text-[10px] ml-0.5 px-1 py-0.2 rounded-full ${
                              isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
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
          }

          if (group.code === 'price_ranges') {
            return (
              <div key={group.code} className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 w-24 flex-shrink-0">
                  {group.label}:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => onSetPriceRange(undefined, undefined)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition border ${
                      minPrice === undefined && maxPrice === undefined
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tất cả mức giá
                  </button>
                  {group.options.map((opt) => {
                    const [minStr, maxStr] = opt.value.split('-');
                    const optMin = minStr ? Number(minStr) : 0;
                    const optMax = maxStr ? Number(maxStr) : Infinity;
                    const isSelected = minPrice === optMin && maxPrice === optMax;

                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          if (isSelected) {
                            onSetPriceRange(undefined, undefined);
                          } else {
                            onSetPriceRange(optMin, optMax);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition border ${
                          isSelected
                            ? 'bg-smart-blue text-white border-smart-blue shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Spec chips (Socket, VRAM, Form Factor...)
          const currentVal = activeSpecs[group.code] || '';
          const activeValues = currentVal ? currentVal.split(',') : [];

          return (
            <div key={group.code} className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 w-24 flex-shrink-0">
                {group.label}:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => {
                    if (activeValues.length > 0) {
                      activeValues.forEach((v) => onToggleSpec(group.code, v));
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition border ${
                    activeValues.length === 0
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tất cả
                </button>
                {group.options.map((opt) => {
                  const isSelected = activeValues.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onToggleSpec(group.code, opt.value)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition border ${
                        isSelected
                          ? 'bg-smart-blue text-white border-smart-blue shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{opt.label}</span>
                      {opt.count > 0 && (
                        <span
                          className={`text-[10px] ml-0.5 px-1 py-0.2 rounded-full ${
                            isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
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
    </div>
  );
};
