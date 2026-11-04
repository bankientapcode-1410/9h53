import React, { useState } from 'react';
import { CompatRule, CreateCompatRuleRequest, RuleSchemaMetadata, RuleSeverity } from '../types/rule.types';
import { VisualExpressionBuilder } from './VisualExpressionBuilder';
import { MessageTemplateEditor } from './MessageTemplateEditor';
import { DryRunSandboxPanel } from './DryRunSandboxPanel';
import { X, Save, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCompatRuleRequest) => Promise<void>;
  initialData?: CompatRule | null;
  metadata: RuleSchemaMetadata;
}

export const RuleFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  metadata,
}) => {
  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState<CreateCompatRuleRequest>({
    rule_name: initialData?.rule_name || '',
    source_category: initialData?.source_category || 'CPU',
    target_category: initialData?.target_category || 'MOTHERBOARD',
    source_spec_key: initialData?.source_spec_key || 'socket_type',
    target_spec_key: initialData?.target_spec_key || 'supported_sockets',
    operator: initialData?.operator || 'IN',
    severity: initialData?.severity || 'ERROR',
    error_message_template:
      initialData?.error_message_template ||
      'CPU socket {source_value} không tương thích với Mainboard (hỗ trợ: {target_value}). Vui lòng chọn Mainboard có socket phù hợp.',
    is_active: initialData?.is_active ?? true,
    priority: initialData?.priority ?? 10,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.rule_name.trim()) {
      setErrorMessage('Tên quy tắc không được để trống.');
      return;
    }
    if (!formData.source_spec_key.trim() || !formData.target_spec_key.trim()) {
      setErrorMessage('Khóa thông số nguồn và đích không được để trống.');
      return;
    }
    if (formData.error_message_template.trim().length < 10) {
      setErrorMessage('Mẫu thông báo lỗi phải có độ dài từ 10 đến 500 ký tự.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Đã xảy ra lỗi khi lưu quy tắc tương thích.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {isEdit ? 'Chỉnh Sửa Quy Tắc Tương Thích' : 'Tạo Mới Quy Tắc Tương Thích (UC6)'}
            </h2>
            <p className="text-xs text-slate-500">
              Cấu hình điều kiện đánh giá phần cứng với hỗ trợ Live Expression & Dry-Run Sandbox
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Name, Severity, Priority, Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700">Tên quy tắc tương thích *</label>
              <input
                type="text"
                required
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="VD: CPU-Motherboard Socket Match"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-smart-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mức độ nghiêm trọng *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as RuleSeverity })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-smart-blue"
              >
                <option value="ERROR">ERROR (Chặn build PC)</option>
                <option value="WARNING">WARNING (Cảnh báo)</option>
                <option value="INFO">INFO (Thông tin)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Độ ưu tiên (Priority) *</label>
              <input
                type="number"
                min="0"
                max="999"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-smart-blue"
              />
            </div>
          </div>

          {/* Row 2: Visual Expression Builder */}
          <VisualExpressionBuilder
            sourceCategory={formData.source_category}
            targetCategory={formData.target_category}
            sourceSpecKey={formData.source_spec_key}
            targetSpecKey={formData.target_spec_key}
            operator={formData.operator}
            metadata={metadata}
            onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
          />

          {/* Row 3: Message Template Editor */}
          <MessageTemplateEditor
            template={formData.error_message_template}
            onChange={(tmpl) => setFormData((prev) => ({ ...prev, error_message_template: tmpl }))}
            allowedPlaceholders={metadata.allowed_placeholders}
          />

          {/* Row 4: Dry-Run Sandbox */}
          <DryRunSandboxPanel ruleDefinition={formData} />

          {/* Active status checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active_checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-smart-blue rounded border-slate-300 focus:ring-smart-blue"
            />
            <label htmlFor="is_active_checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Kích hoạt quy tắc ngay sau khi lưu (is_active = true)
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-smart-blue hover:bg-blue-600 active:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                Đang lưu quy tắc...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Lưu Thay Đổi' : 'Tạo Quy Tắc Tương Thích'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleFormModal;
