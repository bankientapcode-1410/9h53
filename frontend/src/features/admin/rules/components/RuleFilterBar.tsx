import React from 'react';
import { RuleFilterCriteria, RuleSeverity } from '../types/rule.types';
import { Search, Plus, RotateCcw } from 'lucide-react';

interface Props {
  criteria: RuleFilterCriteria;
  onFilterChange: (newCriteria: Partial<RuleFilterCriteria>) => void;
  onReset: () => void;
  onOpenCreateModal: () => void;
  categories: Array<{ category_code: string; category_name: string }>;
}

export const RuleFilterBar: React.FC<Props> = ({
  criteria,
  onFilterChange,
  onReset,
  onOpenCreateModal,
  categories,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
      {/* Top row: search + action button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên luật, khóa thông số, nội dung thông báo..."
            value={criteria.keyword || ''}
            onChange={(e) => onFilterChange({ keyword: e.target.value, page: 0 })}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-smart-blue/20 focus:border-smart-blue transition-all"
          />
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-smart-blue hover:bg-blue-600 active:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm Quy Tắc Mới
        </button>
      </div>

      {/* Second row: select filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
        {/* Source Category */}
        <div>
          <label className="block text-slate-500 font-medium mb-1">Nguồn (Source)</label>
          <select
            value={criteria.source_category || ''}
            onChange={(e) => onFilterChange({ source_category: e.target.value || undefined, page: 0 })}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-smart-blue"
          >
            <option value="">Tất cả nguồn</option>
            {categories.map((c) => (
              <option key={'src-' + c.category_code} value={c.category_code}>
                {c.category_code} ({c.category_name})
              </option>
            ))}
          </select>
        </div>

        {/* Target Category */}
        <div>
          <label className="block text-slate-500 font-medium mb-1">Đích (Target)</label>
          <select
            value={criteria.target_category || ''}
            onChange={(e) => onFilterChange({ target_category: e.target.value || undefined, page: 0 })}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-smart-blue"
          >
            <option value="">Tất cả đích</option>
            {categories
              .filter((c) => c.category_code !== '_SYSTEM')
              .map((c) => (
                <option key={'tgt-' + c.category_code} value={c.category_code}>
                  {c.category_code} ({c.category_name})
                </option>
              ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-slate-500 font-medium mb-1">Mức độ (Severity)</label>
          <select
            value={criteria.severity || ''}
            onChange={(e) => onFilterChange({ severity: (e.target.value as RuleSeverity) || undefined, page: 0 })}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-smart-blue"
          >
            <option value="">Tất cả mức độ</option>
            <option value="ERROR">ERROR (Chặn build)</option>
            <option value="WARNING">WARNING (Cảnh báo)</option>
            <option value="INFO">INFO (Thông tin)</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-slate-500 font-medium mb-1">Trạng thái</label>
          <select
            value={criteria.is_active === undefined ? '' : criteria.is_active ? 'true' : 'false'}
            onChange={(e) =>
              onFilterChange({
                is_active: e.target.value === '' ? undefined : e.target.value === 'true',
                page: 0,
              })
            }
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-smart-blue"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang kích hoạt (Active)</option>
            <option value="false">Đang tắt (Inactive)</option>
          </select>
        </div>

        {/* Reset button */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Đặt lại lọc
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleFilterBar;
