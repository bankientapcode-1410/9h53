import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Folder,
  Layers,
} from 'lucide-react';
import { CategoryTreeDTO } from '../../../product-catalog/types/product.types';
import { categoryService } from '../../../../services/categoryService';
import { productAdminService } from '../../../../services/productAdminService';
import { CategoryTreeEditor } from '../components/CategoryTreeEditor';

export const AdminCategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryTreeDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTreeDTO | null>(null);

  const loadTree = async () => {
    setIsLoading(true);
    try {
      const res = await categoryService.getCategoryTree();
      if (res.success && res.data) {
        setCategories(res.data);
        // Default expand all roots
        const exp: Record<string, boolean> = {};
        res.data.forEach((r) => {
          exp[r.category_id] = true;
        });
        setExpandedIds(exp);
      }
    } catch (err) {
      console.error('Failed to load category tree:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (category: CategoryTreeDTO) => {
    if (category.children && category.children.length > 0) {
      alert('Không thể xóa danh mục còn chứa danh mục con (C5)!');
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa danh mục "${category.category_name}" (${category.category_code})?`
      )
    ) {
      return;
    }

    try {
      const res = await productAdminService.deleteCategory(category.category_id);
      if (res.success || res.status_code === 204) {
        alert('Đã xóa danh mục thành công!');
        loadTree();
      } else {
        alert(res.message || 'Xóa danh mục thất bại');
      }
    } catch (err: any) {
      alert(
        err?.response?.data?.message || err?.message || 'Không thể xóa danh mục đang có sản phẩm hoặc luật tương thích'
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-smart-navy flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-smart-blue" />
            <span>Quản trị Cây Danh Mục (2 Cấp Phân Cấp)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấu trúc Adjacency List (Nhóm cấp 1 &rarr; Danh mục lá cấp 2). Mã category_code được tham chiếu bởi Hardware Rule Engine (UC6)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-smart-blue hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Thêm danh mục mới</span>
        </button>
      </div>

      {/* Category Tree Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500">
          <span>Danh sách phân cấp theo Nhóm &rarr; Danh mục lá</span>
          <span className="font-semibold text-smart-blue">{categories.length} Nhóm chính</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-smart-blue border-t-transparent rounded-full animate-spin" />
            <span>Đang tải cây danh mục...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((root) => {
              const isExpanded = !!expandedIds[root.category_id];

              return (
                <div
                  key={root.category_id}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
                >
                  {/* Root Node Header (Cấp 1) */}
                  <div className="bg-slate-50/80 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(root.category_id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-smart-blue" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <Folder className="w-4 h-4 text-amber-500" />
                      <div>
                        <span className="font-extrabold text-sm text-slate-800">
                          {root.category_name}
                        </span>
                        <span className="ml-2 font-mono text-[11px] bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded">
                          {root.category_code}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 hidden md:inline ml-2">
                        {root.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 mr-2">
                        {root.children?.length || 0} mục con
                      </span>
                      <button
                        onClick={() => {
                          setEditingCategory(root);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-smart-blue rounded-lg hover:bg-slate-200 transition"
                        title="Chỉnh sửa nhóm"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(root)}
                        className="p-1.5 text-slate-400 hover:text-smart-red rounded-lg hover:bg-red-50 transition"
                        title="Xóa nhóm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Child Leaves (Cấp 2) */}
                  {isExpanded && root.children && root.children.length > 0 && (
                    <div className="divide-y divide-slate-100 bg-white">
                      {root.children.map((child) => (
                        <div
                          key={child.category_id}
                          className="px-6 py-3 pl-12 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Layers className="w-4 h-4 text-smart-blue" />
                            <div>
                              <span className="font-bold text-xs md:text-sm text-slate-700">
                                {child.category_name}
                              </span>
                              <span className="ml-2 font-mono text-[11px] bg-blue-50 text-smart-blue border border-blue-200 px-2 py-0.5 rounded font-semibold">
                                {child.category_code}
                              </span>
                            </div>

                            {/* Schema status */}
                            {child.has_schema ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-2">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Có Schema UC6</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full ml-2">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>Chưa có Schema Specs</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCategory(child);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-smart-blue rounded-lg hover:bg-slate-100 transition"
                              title="Sửa danh mục lá"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(child)}
                              className="p-1.5 text-slate-400 hover:text-smart-red rounded-lg hover:bg-red-50 transition"
                              title="Xóa danh mục lá"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <CategoryTreeEditor
        isOpen={isModalOpen}
        category={editingCategory}
        rootCategories={categories}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSuccess={() => {
          loadTree();
        }}
      />
    </div>
  );
};
