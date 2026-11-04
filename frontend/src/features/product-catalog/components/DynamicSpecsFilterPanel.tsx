import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, Check, X, RotateCcw } from 'lucide-react';
import { SpecMetadataDTO, FacetFilterGroupDTO, FieldDefinitionDTO } from '../types/product.types';

interface SpecOption {
  value: string;
  label: string;
  count?: number;
}

interface SpecSlideDownSelectProps {
  field: FieldDefinitionDTO;
  facetGroup?: FacetFilterGroupDTO;
  selectedValue: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}

const getOptions = (field: FieldDefinitionDTO, facetGroup?: FacetFilterGroupDTO): SpecOption[] => {
  // 1. If BOOLEAN type:
  if (field.type === 'BOOLEAN') {
    const trueFacet = facetGroup?.options?.find(
      (o) => o.value === 'true' || o.value === '1' || o.value === 'Có'
    );
    const falseFacet = facetGroup?.options?.find(
      (o) => o.value === 'false' || o.value === '0' || o.value === 'Không'
    );
    return [
      {
        value: 'true',
        label: field.key === 'integrated_graphics' ? 'Có iGPU' : `Có ${field.label}`,
        count: trueFacet?.count,
      },
      {
        value: 'false',
        label: field.key === 'integrated_graphics' ? 'Không có iGPU' : `Không có ${field.label}`,
        count: falseFacet?.count,
      },
    ];
  }

  // 2. If facetGroup has options from DB products:
  if (facetGroup?.options && facetGroup.options.length > 0) {
    return facetGroup.options.map((opt) => ({
      value: opt.value,
      label: opt.label || (field.unit ? `${opt.value} ${field.unit}` : opt.value),
      count: opt.count,
    }));
  }

  // 3. Fallback to schema allowedValues if any:
  if (field.allowedValues && field.allowedValues.length > 0) {
    return field.allowedValues.map((val: string) => ({
      value: val,
      label: field.unit ? `${val} ${field.unit}` : val,
      count: undefined,
    }));
  }

  return [];
};

export const SpecSlideDownSelect: React.FC<SpecSlideDownSelectProps> = ({
  field,
  facetGroup,
  selectedValue,
  onSelect,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = getOptions(field, facetGroup);
  const selectedOption = options.find((o) => o.value === selectedValue);

  // Click outside listener to close slide down menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasSelection = Boolean(selectedValue);

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      {/* Field Label Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span className="truncate">{field.label}</span>
        {field.unit && (
          <span className="text-[10px] text-slate-400 font-normal shrink-0">({field.unit})</span>
        )}
      </div>

      {/* Slide down trigger button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl border transition text-left cursor-pointer ${
            hasSelection
              ? 'bg-blue-50/80 border-smart-blue text-smart-blue font-bold shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <span className="truncate">
            {hasSelection ? selectedOption?.label || selectedValue : `Tất cả`}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {hasSelection && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                title="Bỏ chọn"
                className="p-0.5 hover:bg-blue-200/60 rounded-full text-smart-blue transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-smart-blue' : ''
              }`}
            />
          </div>
        </button>

        {/* Slide Down Menu Panel */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 space-y-0.5 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Reset / All Option */}
            <button
              type="button"
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                !hasSelection
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Tất cả {field.label}</span>
              {!hasSelection && <Check className="w-3.5 h-3.5" />}
            </button>

            {/* List of Dynamic Options */}
            {options.map((opt) => {
              const isSelected = selectedValue === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    onSelect(isSelected ? '' : opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-smart-blue font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-normal ${
                          isSelected
                            ? 'bg-blue-200/80 text-smart-blue'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {opt.count}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-smart-blue" />}
                  </div>
                </button>
              );
            })}

            {options.length === 0 && (
              <div className="px-3 py-2 text-center text-xs text-slate-400 italic">
                Chưa có dữ liệu lựa chọn
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface DynamicSpecsFilterPanelProps {
  specMetadata?: SpecMetadataDTO | null;
  facets?: FacetFilterGroupDTO[];
  activeSpecs?: Record<string, string>;
  onToggleSpec?: (specKey: string, value: string) => void;
  onSetSpec?: (specKey: string, value: string | null) => void;
  onClearSpecs?: () => void;
}

export const DynamicSpecsFilterPanel: React.FC<DynamicSpecsFilterPanelProps> = ({
  specMetadata,
  facets = [],
  activeSpecs = {},
  onToggleSpec,
  onSetSpec,
  onClearSpecs,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!specMetadata || !specMetadata.has_schema || !specMetadata.fields) {
    return null;
  }

  const filterableFields = specMetadata.fields.filter((f) => f.filterable);
  if (filterableFields.length === 0) {
    return null;
  }

  const activeSpecsCount = Object.keys(activeSpecs).filter(
    (k) => activeSpecs[k] !== undefined && activeSpecs[k] !== ''
  ).length;

  const handleSelect = (key: string, value: string) => {
    if (onSetSpec) {
      onSetSpec(key, value || null);
    } else if (onToggleSpec) {
      onToggleSpec(key, value);
    }
  };

  const handleClear = (key: string) => {
    if (onSetSpec) {
      onSetSpec(key, null);
    } else if (onToggleSpec) {
      onToggleSpec(key, '');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200/80 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left group cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-smart-blue" />
          <h4 className="font-bold text-sm text-smart-navy group-hover:text-smart-blue transition">
            Bộ lọc chi tiết ({specMetadata.category_name || specMetadata.category_code})
          </h4>
          {activeSpecsCount > 0 && (
            <span className="text-[10px] font-semibold text-smart-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {activeSpecsCount} thông số đang lọc
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
          )}
        </button>

        {activeSpecsCount > 0 && onClearSpecs && (
          <button
            type="button"
            onClick={onClearSpecs}
            className="flex items-center gap-1 text-xs text-smart-red hover:underline font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa thông số</span>
          </button>
        )}
      </div>

      {/* Grid of Slide Down Selectors */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          {filterableFields.map((field) => {
            const currentVal = activeSpecs[field.key] || '';
            const facetGroup = facets.find(
              (g) =>
                g.code === field.key ||
                (g as any).group_key === field.key ||
                (g as any).groupKey === field.key
            );

            return (
              <SpecSlideDownSelect
                key={field.key}
                field={field}
                facetGroup={facetGroup}
                selectedValue={currentVal}
                onSelect={(val) => handleSelect(field.key, val)}
                onClear={() => handleClear(field.key)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
