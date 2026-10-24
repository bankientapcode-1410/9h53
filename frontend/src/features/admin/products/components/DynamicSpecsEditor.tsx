import React from 'react';
import { SpecMetadataDTO, FieldDefinitionDTO } from '../../../product-catalog/types/product.types';
import { AlertCircle, HelpCircle, Plus, X } from 'lucide-react';

interface DynamicSpecsEditorProps {
  specMetadata?: SpecMetadataDTO | null;
  values: Record<string, any>;
  onChange: (specs: Record<string, any>) => void;
  errors?: Record<string, string>;
}

export const DynamicSpecsEditor: React.FC<DynamicSpecsEditorProps> = ({
  specMetadata,
  values,
  onChange,
  errors = {},
}) => {
  const handleFieldChange = (key: string, value: any) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  const handleArrayStringToggle = (key: string, item: string) => {
    const current = Array.isArray(values[key]) ? [...values[key]] : [];
    const index = current.indexOf(item);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(item);
    }
    handleFieldChange(key, current);
  };

  const [customKey, setCustomKey] = React.useState('');
  const [customVal, setCustomVal] = React.useState('');

  const handleAddCustomSpec = () => {
    if (!customKey.trim()) return;
    const key = customKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    handleFieldChange(key, customVal);
    setCustomKey('');
    setCustomVal('');
  };

  const handleRemoveCustomSpec = (key: string) => {
    const copy = { ...values };
    delete copy[key];
    onChange(copy);
  };

  if (!specMetadata || !specMetadata.has_schema) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-800">
        <div className="flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Danh mục này chưa có cấu hình Schema specs trong Registry!</span>
        </div>
        <p>
          Bạn có thể nhập thông số tự do dạng khóa - giá trị bên dưới, hoặc chọn danh mục lá chuẩn (CPU, GPU, RAM, Mainboard...) để sinh form động.
        </p>
      </div>
    );
  }

  const registeredKeys = new Set(specMetadata.fields.map((f) => f.key));
  const customEntries = Object.entries(values).filter(([k]) => !registeredKeys.has(k));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h4 className="font-bold text-sm text-smart-navy flex items-center gap-1.5">
          <span>Thông số kỹ thuật JSON Specs ({specMetadata.category_code})</span>
          <span className="text-[11px] font-normal text-slate-400">
            (Bắt buộc cho Rule Engine UC6 & AI Vector UC1)
          </span>
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {specMetadata.fields.map((field: FieldDefinitionDTO) => {
          const val = values[field.key];
          const fieldError = errors[`specs.${field.key}`] || errors[field.key];

          return (
            <div key={field.key} className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-smart-red">*</span>}
                </span>
                {field.unit && (
                  <span className="text-[11px] text-slate-400 font-normal">Đơn vị: {field.unit}</span>
                )}
              </label>

              {/* RENDER FIELD INPUT BY TYPE */}
              {field.type === 'BOOLEAN' ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleFieldChange(field.key, true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      val === true
                        ? 'bg-smart-blue text-white border-smart-blue shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Có (True)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange(field.key, false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      val === false
                        ? 'bg-smart-blue text-white border-smart-blue shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Không (False)
                  </button>
                </div>
              ) : field.type === 'ARRAY_STRING' ? (
                <div className="space-y-2">
                  {field.allowedValues && field.allowedValues.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {field.allowedValues.map((opt) => {
                        const isSelected = Array.isArray(val) && val.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleArrayStringToggle(field.key, opt)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                              isSelected
                                ? 'bg-smart-blue text-white border-smart-blue shadow-sm'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Các giá trị phân tách dấu phẩy (VD: ATX, Micro-ATX)"
                      value={Array.isArray(val) ? val.join(', ') : val || ''}
                      onChange={(e) =>
                        handleFieldChange(
                          field.key,
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className={`w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-smart-blue/20 ${
                        fieldError ? 'border-smart-red bg-red-50/20' : 'border-slate-200 focus:border-smart-blue'
                      }`}
                    />
                  )}
                </div>
              ) : field.allowedValues && field.allowedValues.length > 0 ? (
                <select
                  value={val !== undefined && val !== null ? String(val) : ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-smart-blue/20 ${
                    fieldError ? 'border-smart-red bg-red-50/20' : 'border-slate-200 focus:border-smart-blue'
                  }`}
                >
                  <option value="">-- Chọn {field.label} --</option>
                  {field.allowedValues.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'NUMBER' || field.type === 'INTEGER' ? 'number' : 'text'}
                  step={field.type === 'NUMBER' ? '0.1' : '1'}
                  min={field.minValue !== null && field.minValue !== undefined ? field.minValue : undefined}
                  value={val !== undefined && val !== null ? val : ''}
                  placeholder={`Nhập ${field.label}...`}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (field.type === 'INTEGER') {
                      handleFieldChange(field.key, raw === '' ? undefined : parseInt(raw, 10));
                    } else if (field.type === 'NUMBER') {
                      handleFieldChange(field.key, raw === '' ? undefined : parseFloat(raw));
                    } else {
                      handleFieldChange(field.key, raw);
                    }
                  }}
                  className={`w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-smart-blue/20 ${
                    fieldError ? 'border-smart-red bg-red-50/20' : 'border-slate-200 focus:border-smart-blue'
                  }`}
                />
              )}

              {fieldError && (
                <div className="flex items-center gap-1 text-[11px] text-smart-red font-semibold">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldError}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional Custom Specs (Section 4.3.B S7) */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>Thông số bổ sung ngoài Schema</span>
            <span title="Chấp nhận hiển thị thêm, không dùng lọc">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </span>
        </div>

        {customEntries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customEntries.map(([k, v]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs border border-slate-200"
              >
                <span className="font-bold">{k}:</span>
                <span>{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomSpec(k)}
                  className="hover:text-smart-red text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Khóa (snake_case VD: warranty_months)"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl flex-1 focus:outline-none focus:border-smart-blue"
          />
          <input
            type="text"
            placeholder="Giá trị (VD: 36)"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl flex-1 focus:outline-none focus:border-smart-blue"
          />
          <button
            type="button"
            onClick={handleAddCustomSpec}
            className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
