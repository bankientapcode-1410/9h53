import React from 'react';
import { CompatRule } from '../types/rule.types';
import { RuleSeverityBadge } from './RuleSeverityBadge';
import { Edit2, Trash2, ArrowRight, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

interface Props {
  rules: CompatRule[];
  loading: boolean;
  onEdit: (rule: CompatRule) => void;
  onDelete: (rule: CompatRule) => void;
  onToggleStatus: (rule: CompatRule, nextStatus: boolean) => void;
  pageNumber: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
}

export const RuleTable: React.FC<Props> = ({
  rules,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  pageNumber,
  totalPages,
  totalElements,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-sm">
        <div className="animate-spin w-8 h-8 border-4 border-smart-blue border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Đang tải danh sách quy tắc tương thích...</p>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-700 mb-1">Không tìm thấy quy tắc nào</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Không có quy tắc tương thích phù hợp với bộ lọc hiện tại. Vui lòng thay đổi tiêu chí lọc hoặc thêm quy tắc mới.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
              <th className="py-2.5 px-2.5 w-12 text-center">Ưu tiên</th>
              <th className="py-2.5 px-3 w-[220px] lg:w-[260px]">Tên quy tắc</th>
              <th className="py-2.5 px-3 w-36 lg:w-40">Luồng đối chiếu</th>
              <th className="py-2.5 px-3 w-48 lg:w-56">Biểu thức điều kiện</th>
              <th className="py-2.5 px-2 w-24 text-center">Mức độ</th>
              <th className="py-2.5 px-2 w-24 text-center">Trạng thái</th>
              <th className="py-2.5 px-2.5 w-20 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {rules.map((rule) => (
              <tr
                key={rule.rule_id}
                className="hover:bg-slate-50/60 transition-colors group"
              >
                {/* Priority */}
                <td className="py-2.5 px-2.5 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                    {rule.priority}
                  </span>
                </td>

                {/* Rule Name & Message preview */}
                <td className="py-2.5 px-3 max-w-[220px] lg:max-w-[260px]">
                  <div
                    className="font-semibold text-slate-800 text-xs truncate"
                    title={rule.rule_name}
                  >
                    {rule.rule_name}
                  </div>
                  <div
                    className="text-[11px] text-slate-400 truncate mt-0.5"
                    title={rule.error_message_template}
                  >
                    {rule.error_message_template}
                  </div>
                </td>

                {/* Categories Flow */}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                    <span className="font-bold text-smart-blue">{rule.source_category}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-bold text-emerald-700">{rule.target_category}</span>
                  </div>
                </td>

                {/* Condition Expression */}
                <td className="py-2.5 px-3">
                  <div className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 max-w-full">
                    <span className="text-blue-600 truncate max-w-[85px]" title={rule.source_spec_key}>
                      {rule.source_spec_key}
                    </span>
                    <span className="font-bold text-amber-600 shrink-0 px-0.5">
                      {rule.operator}
                    </span>
                    <span className="text-emerald-600 truncate max-w-[85px]" title={rule.target_spec_key}>
                      {rule.target_spec_key}
                    </span>
                  </div>
                </td>

                {/* Severity Badge */}
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  <RuleSeverityBadge severity={rule.severity} size="sm" />
                </td>

                {/* Status Toggle Switch */}
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  <button
                    onClick={() => onToggleStatus(rule, !rule.is_active)}
                    title={rule.is_active ? 'Bấm để tắt quy tắc' : 'Bấm để kích hoạt quy tắc'}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                      rule.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {rule.is_active ? (
                      <>
                        <ToggleRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Active
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Off
                      </>
                    )}
                  </button>
                </td>

                {/* Action buttons */}
                <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                  <div className="inline-flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(rule)}
                      title="Chỉnh sửa quy tắc"
                      className="p-1 text-slate-500 hover:text-smart-blue hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(rule)}
                      title="Xóa quy tắc"
                      className="p-1 text-slate-400 hover:text-smart-red hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 border-t border-slate-200/80 text-xs text-slate-600">
          <div>
            Tổng số: <span className="font-semibold text-slate-800">{totalElements}</span> quy tắc (Trang {pageNumber + 1}/{totalPages})
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={pageNumber === 0}
              onClick={() => onPageChange(pageNumber - 1)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Trước
            </button>
            <span className="px-2 font-semibold text-slate-700">{pageNumber + 1}</span>
            <button
              disabled={pageNumber + 1 >= totalPages}
              onClick={() => onPageChange(pageNumber + 1)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleTable;
