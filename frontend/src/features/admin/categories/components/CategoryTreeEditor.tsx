import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import {
  CategoryTreeDTO,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../../product-catalog/types/product.types';
import { productAdminService } from '../../../../services/productAdminService';

interface CategoryTreeEditorProps {
  isOpen: boolean;
  category?: CategoryTreeDTO | null; // Edit if provided, else create
  rootCategories: CategoryTreeDTO[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CategoryTreeEditor: React.FC<CategoryTreeEditorProps> = ({
  isOpen,
  category,
  rootCategories,
  onClose,
  onSuccess,
}) => {
  const isEditMode = !!category;

  const [categoryCode, setCategoryCode] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [parentId, setParentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setCategoryCode(category.category_code);
      setCategoryName(category.category_name);
      setDescription(category.description || '');
      setParentId(category.parent_category_id || '');
    } else {
      setCategoryCode('');
      setCategoryName('');
      setDescription('');
      setParentId('');
    }
    setError(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!categoryName.trim()) {
      setError('Tên danh mục không được để trống');
      setIsSubmitting(false);
      return;
    }

    if (!isEditMode) {
      const codeRegex = /^[A-Z][A-Z0-9_]{1,49}$/;
      if (!codeRegex.test(categoryCode.trim().toUpperCase())) {
        setError(
          'Mã danh mục (category_code) phải viết hoa, bắt đầu bằng chữ cái, từ 2 đến 50 ký tự (VD: CPU, GPU, MONITOR...)'
        );
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (isEditMode && category) {
        const payload: UpdateCategoryRequest = {
          category_name: categoryName.trim(),
          description: description.trim() || undefined,
          parent_category_id: parentId || null,
        };

        const res = await productAdminService.updateCategory(category.category_id, payload);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.message || 'Cập nhật danh mục thất bại');
        }
      } else {
        const payload: CreateCategoryRequest = {
          category_code: categoryCode.trim().toUpperCase(),
          category_name: categoryName.trim(),
          description: description.trim() || undefined,
          parent_category_id: parentId || null,
        };

        const res = await productAdminService.createCategory(payload);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.message || 'Tạo danh mục thất bại');
        }
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu thông tin danh mục'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-smart-navy">
            {isEditMode ? `Sửa danh mục: ${category?.category_name}` : 'Tạo danh mục linh kiện mới'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-smart-red font-semibold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Mã danh mục (Category Code) <span className="text-smart-red">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isEditMode}
              placeholder="VD: GPU, RAM, MONITOR..."
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl uppercase font-mono disabled:bg-slate-100 disabled:cursor-not-allowed focus:outline-none focus:border-smart-blue"
            />
            {isEditMode ? (
              <span className="text-[11px] text-slate-400 block">
                Mã danh mục là bất biến vì được các tập luật UC6 tham chiếu
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 block">
                Chỉ chứa chữ hoa, số và dấu gạch dưới (VD: SSD_M2, CPU_COOLER)
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Tên hiển thị danh mục <span className="text-smart-red">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Màn hình máy tính"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-smart-blue"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Danh mục cha (Cấp 1 - Nhóm)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-smart-blue"
            >
              <option value="">-- Là nhóm gốc (Cấp 1) --</option>
              {rootCategories
                .filter((r) => r.category_id !== category?.category_id)
                .map((r) => (
                  <option key={r.category_id} value={r.category_id}>
                    {r.category_name} ({r.category_code})
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Mô tả danh mục</label>
            <textarea
              rows={3}
              placeholder="Ghi chú về nhóm linh kiện này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-smart-blue"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-smart-blue hover:bg-blue-700 text-white shadow flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Cập nhật' : 'Tạo mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
