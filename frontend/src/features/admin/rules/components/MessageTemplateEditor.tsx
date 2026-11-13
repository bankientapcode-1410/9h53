import React from 'react';
import { Tag, Sparkles } from 'lucide-react';

interface Props {
  template: string;
  onChange: (value: string) => void;
  allowedPlaceholders: string[];
}

export const MessageTemplateEditor: React.FC<Props> = ({
  template,
  onChange,
  allowedPlaceholders,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInsertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(template + placeholder);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = template.substring(0, start);
    const textAfter = template.substring(end);
    const nextVal = textBefore + placeholder + textAfter;
    onChange(nextVal);

    setTimeout(() => {
      textarea.focus();
      const pos = start + placeholder.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  const preview = React.useMemo(() => {
    if (!template) return '';
    return template
      .replace('{source_name}', 'Intel Core i7-13700K')
      .replace('{source_value}', 'LGA1700')
      .replace('{target_name}', 'ASUS ROG Crosshair X670E')
      .replace('{target_value}', 'AM5')
      .replace('{source_category}', 'CPU')
      .replace('{target_category}', 'MOTHERBOARD');
  }, [template]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          Mẫu Thông Báo Lỗi Khi Vi Phạm (Error Message Template) *
        </label>
        <span
          className={`text-xs ${
            template.length < 10 || template.length > 500
              ? 'text-red-500 font-semibold'
              : 'text-slate-400'
          }`}
        >
          {template.length}/500 ký tự (tối thiểu 10)
        </span>
      </div>

      <textarea
        ref={textareaRef}
        rows={3}
        value={template}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ví dụ: CPU socket {source_value} không tương thích với Mainboard {target_name} (hỗ trợ: {target_value})."
        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-smart-blue/20 focus:border-smart-blue transition-all font-sans text-slate-800"
      />

      {/* Quick insert buttons */}
      <div className="space-y-1.5">
        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
          <Tag className="w-3 h-3 text-smart-blue" />
          Bấm để chèn nhanh biến nội suy:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allowedPlaceholders.map((ph) => (
            <button
              key={ph}
              type="button"
              onClick={() => handleInsertPlaceholder(ph)}
              className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-smart-blue text-[11px] font-mono rounded-lg transition-all shadow-2xs"
            >
              + {ph}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      {preview && (
        <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
          <div className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider mb-1 text-amber-800">
            <Sparkles className="w-3 h-3" />
            Xem trước nội suy thực tế:
          </div>
          <p className="italic">"{preview}"</p>
        </div>
      )}
    </div>
  );
};

export default MessageTemplateEditor;
