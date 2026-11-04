import React from 'react';
import { RuleOperator, RuleSchemaMetadata } from '../types/rule.types';
import { Sparkles } from 'lucide-react';

interface Props {
  sourceCategory: string;
  targetCategory: string;
  sourceSpecKey: string;
  targetSpecKey: string;
  operator: RuleOperator;
  metadata: RuleSchemaMetadata;
  onChange: (updates: {
    source_category?: string;
    target_category?: string;
    source_spec_key?: string;
    target_spec_key?: string;
    operator?: RuleOperator;
  }) => void;
}

export const VisualExpressionBuilder: React.FC<Props> = ({
  sourceCategory,
  targetCategory,
  sourceSpecKey,
  targetSpecKey,
  operator,
  metadata,
  onChange,
}) => {
  const sourceSpecOptions = React.useMemo(() => {
    if (!sourceCategory) return [];
    if (sourceCategory === '_SYSTEM') {
      return [{ key: '_total_tdp_w', label: 'Tổng TDP toàn hệ thống (W)', type: 'NUMBER' }];
    }
    const categorySpecs = metadata.spec_keys_by_category[sourceCategory] || [];
    const aggregates = metadata.builtin_aggregate_keys.map((agg) => ({
      key: agg.key,
      label: agg.label,
      type: 'AGGREGATE',
    }));
    return [...categorySpecs, ...aggregates];
  }, [sourceCategory, metadata]);

  const targetSpecOptions = React.useMemo(() => {
    if (!targetCategory || targetCategory === '_SYSTEM') return [];
    return metadata.spec_keys_by_category[targetCategory] || [];
  }, [targetCategory, metadata]);

  const handleSourceCatChange = (newCat: string) => {
    if (newCat === '_SYSTEM') {
      onChange({
        source_category: newCat,
        source_spec_key: '_total_tdp_w',
        target_category: targetCategory === '_SYSTEM' ? 'PSU' : targetCategory,
      });
    } else {
      onChange({ source_category: newCat });
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
        <Sparkles className="w-4 h-4 text-smart-blue" />
        Trình Dựng Biểu Thức Điều Kiện (Visual Expression Builder)
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
        {/* Step 1: Source Category & Key */}
        <div className="md:col-span-2 space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <label className="block text-xs font-semibold text-slate-600">
            1. Vế Nguồn (Source)
          </label>
          <select
            value={sourceCategory}
            onChange={(e) => handleSourceCatChange(e.target.value)}
            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-smart-blue"
          >
            <option value="">-- Chọn Danh Mục Nguồn --</option>
            {metadata.categories.map((c) => (
              <option key={'src-' + c.category_code} value={c.category_code}>
                {c.category_code} ({c.category_name})
              </option>
            ))}
          </select>

          <div className="relative">
            <input
              type="text"
              list="source-spec-keys-list"
              placeholder="Nhập hoặc chọn khóa thông số (source_spec_key)..."
              value={sourceSpecKey}
              onChange={(e) => onChange({ source_spec_key: e.target.value })}
              className="w-full text-xs font-mono px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-smart-blue"
            />
            <datalist id="source-spec-keys-list">
              {sourceSpecOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.key} - {opt.label}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        {/* Step 2: Operator */}
        <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
          <label className="block text-xs font-semibold text-slate-600">
            2. Toán Tử
          </label>
          <select
            value={operator}
            onChange={(e) => onChange({ operator: e.target.value as RuleOperator })}
            className="w-full text-xs font-bold text-center px-2 py-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            {metadata.operators.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
          <div className="text-[10px] text-slate-400">
            {operator === 'IN' && 'Thuộc tập hợp'}
            {operator === 'NOT_IN' && 'Không thuộc tập hợp'}
            {operator === 'EQUALS' && 'Bằng nhau'}
            {operator === 'LTE' && 'Nhỏ hơn hoặc bằng (<=)'}
            {operator === 'GTE' && 'Lớn hơn hoặc bằng (>=)'}
            {operator === 'RANGE' && 'Trong khoảng [min, max]'}
          </div>
        </div>

        {/* Step 3: Target Category & Key */}
        <div className="md:col-span-2 space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <label className="block text-xs font-semibold text-slate-600">
            3. Vế Đích (Target)
          </label>
          <select
            value={targetCategory}
            onChange={(e) => onChange({ target_category: e.target.value })}
            className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-smart-blue"
          >
            <option value="">-- Chọn Danh Mục Đích --</option>
            {metadata.categories
              .filter((c) => c.category_code !== '_SYSTEM')
              .map((c) => (
                <option key={'tgt-' + c.category_code} value={c.category_code}>
                  {c.category_code} ({c.category_name})
                </option>
              ))}
          </select>

          <div className="relative">
            <input
              type="text"
              list="target-spec-keys-list"
              placeholder="Nhập hoặc chọn khóa thông số (target_spec_key)..."
              value={targetSpecKey}
              onChange={(e) => onChange({ target_spec_key: e.target.value })}
              className="w-full text-xs font-mono px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-smart-blue"
            />
            <datalist id="target-spec-keys-list">
              {targetSpecOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.key} - {opt.label}
                </option>
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Live expression summary bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs text-blue-900 font-mono">
        <span className="font-bold text-smart-navy">{sourceCategory || '?'}.{sourceSpecKey || '?'}</span>
        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 font-black rounded">{operator}</span>
        <span className="font-bold text-emerald-800">{targetCategory || '?'}.{targetSpecKey || '?'}</span>
      </div>
    </div>
  );
};

export default VisualExpressionBuilder;
