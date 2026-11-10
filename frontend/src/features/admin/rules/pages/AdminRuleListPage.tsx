import React, { useState, useEffect, useCallback } from 'react';
import {
  CompatRule,
  CreateCompatRuleRequest,
  RuleFilterCriteria,
  RuleSchemaMetadata,
} from '../types/rule.types';
import { ruleAdminService, FALLBACK_RULE_METADATA } from '../../../../services/ruleAdminService';
import { RuleFilterBar } from '../components/RuleFilterBar';
import { RuleTable } from '../components/RuleTable';
import { RuleFormModal } from '../components/RuleFormModal';
import { Sliders, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminRuleListPage: React.FC = () => {
  const [rules, setRules] = useState<CompatRule[]>([]);
  const [metadata, setMetadata] = useState<RuleSchemaMetadata>(FALLBACK_RULE_METADATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & Pagination state
  const [criteria, setCriteria] = useState<RuleFilterCriteria>({
    page: 0,
    size: 20,
  });
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CompatRule | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch metadata once on mount
  useEffect(() => {
    let mounted = true;
    ruleAdminService
      .getMetadataSchema()
      .then((res) => {
        if (mounted && res?.data) {
          setMetadata(res.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load rule schema metadata:', err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch rules whenever criteria changes
  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ruleAdminService.getRules(criteria);
      if (res?.data) {
        setRules(res.data.content || []);
        setPageNumber(res.data.page || 0);
        setTotalPages(res.data.total_pages || 1);
        setTotalElements(res.data.total_elements || 0);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách quy tắc');
    } finally {
      setLoading(false);
    }
  }, [criteria]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleFilterChange = (updates: Partial<RuleFilterCriteria>) => {
    setCriteria((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setCriteria({ page: 0, size: 20 });
  };

  const handlePageChange = (newPage: number) => {
    setCriteria((prev) => ({ ...prev, page: newPage }));
  };

  // Actions
  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: CompatRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (rule: CompatRule, nextStatus: boolean) => {
    try {
      await ruleAdminService.updateRuleStatus(rule.rule_id, nextStatus);
      showToast(`Đã ${nextStatus ? 'kích hoạt' : 'tắt'} quy tắc "${rule.rule_name}" và làm mới cache.`);
      fetchRules();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể thay đổi trạng thái quy tắc');
    }
  };

  const handleDeleteRule = async (rule: CompatRule) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa quy tắc tương thích "${rule.rule_name}"?`)) {
      return;
    }
    try {
      await ruleAdminService.deleteRule(rule.rule_id);
      showToast(`Đã xóa quy tắc "${rule.rule_name}" thành công.`);
      fetchRules();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xóa quy tắc');
    }
  };

  const handleSaveRule = async (data: CreateCompatRuleRequest) => {
    if (editingRule) {
      await ruleAdminService.updateRule(editingRule.rule_id, data);
      showToast(`Đã cập nhật quy tắc "${data.rule_name}" thành công.`);
    } else {
      await ruleAdminService.createRule(data);
      showToast(`Đã tạo mới quy tắc "${data.rule_name}" thành công.`);
    }
    fetchRules();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4 text-amber-600" />
            Phân Hệ Quản Trị Hệ Thống (UC6 & WBS 7.4)
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Quản Lý Tập Luật Tương Thích Phần Cứng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình tập luật suy diễn cho PC Builder, PC Profile và Giỏ hàng • Bộ nhớ đệm Caffeine &lt; 2ms
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs">
            <span className="text-slate-400 block text-[10px]">Tập luật khả dụng</span>
            <span className="text-slate-800 font-extrabold text-sm">{totalElements} quy tắc</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs text-xs">
            <span className="text-emerald-600 block text-[10px]">Caffeine Cache</span>
            <span className="text-emerald-800 font-extrabold text-sm flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Ready (In-Memory)
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <RuleFilterBar
        criteria={criteria}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onOpenCreateModal={handleOpenCreateModal}
        categories={metadata.categories}
      />

      {/* Data Table */}
      <RuleTable
        rules={rules}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteRule}
        onToggleStatus={handleToggleStatus}
        pageNumber={pageNumber}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={handlePageChange}
      />

      {/* Modal Create / Edit with Sandbox */}
      {isModalOpen && (
        <RuleFormModal
          key={editingRule ? editingRule.rule_id : 'new-rule'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveRule}
          initialData={editingRule}
          metadata={metadata}
        />
      )}
    </div>
  );
};

export default AdminRuleListPage;
