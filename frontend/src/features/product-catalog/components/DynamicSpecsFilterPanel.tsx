import React from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { SpecMetadataDTO } from '../types/product.types';

interface DynamicSpecsFilterPanelProps {
  specMetadata?: SpecMetadataDTO | null;
  activeSpecs?: Record<string, string>;
  onToggleSpec: (specKey: string, value: string) => void;
  onClearSpecs?: () => void;
}

export const DynamicSpecsFilterPanel: React.FC<DynamicSpecsFilterPanelProps> = ({
  specMetadata,
  activeSpecs = {},
  onToggleSpec,
}) => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(true);

  if (!specMetadata || !specMetadata.has_schema || !specMetadata.fields) {
    return null;
  }

  const filterableFields = specMetadata.fields.filter((f) => f.filterable);
  if (filterableFields.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200/80 space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-smart-blue" />
          <h4 className="font-bold text-sm text-smart-navy group-hover:text-smart-blue transition">
            Bộ lọc chi tiết ({specMetadata.category_name || specMetadata.category_code})
          </h4>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
        )}
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          {filterableFields.map((field) => {
            const currentVal = activeSpecs[field.key] || '';
            const activeValues = currentVal ? currentVal.split(',') : [];

            return (
              <div key={field.key} className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>{field.label}</span>
                  {field.unit && <span className="text-[10px] text-slate-400 font-normal">({field.unit})</span>}
                </div>

                {field.type === 'BOOLEAN' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleSpec(field.key, 'true')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                        activeValues.includes('true')
                          ? 'bg-smart-blue text-white border-smart-blue shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Có
                    </button>
                    <button
                      onClick={() => onToggleSpec(field.key, 'false')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                        activeValues.includes('false')
                          ? 'bg-smart-blue text-white border-smart-blue shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Không
                    </button>
                  </div>
                ) : field.allowedValues && field.allowedValues.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {field.allowedValues.map((val) => {
                      const isSelected = activeValues.includes(val);
                      return (
                        <button
                          key={val}
                          onClick={() => onToggleSpec(field.key, val)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                            isSelected
                              ? 'bg-smart-blue text-white border-smart-blue shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Lọc ${field.label}...`}
                      value={currentVal}
                      onChange={(e) => onToggleSpec(field.key, e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-smart-blue focus:ring-1 focus:ring-smart-blue"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
