import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Flame,
  Power,
  Layers,
} from 'lucide-react';
import { AdminProductDTO } from '../../../product-catalog/types/product.types';
import { productAdminService } from '../../../../services/productAdminService';
import { useCategoryStore } from '../../../../stores/useCategoryStore';
import { VectorSyncBadge } from '../components/VectorSyncBadge';
import { ManualSyncButton } from '../components/ManualSyncButton';
import { ProductFormModal } from '../components/ProductFormModal';

export const AdminProductListPage: React.FC = () => {
  const { fetchCategories, getLeafCategories } = useCategoryStore();
  const leafCategories = getLeafCategories();

  const [products, setProducts] = useState<AdminProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [size] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [syncStatusFilter, setSyncStatusFilter] = useState<string>('');
  const [includeDeleted, setIncludeDeleted] = useState<boolean>(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductDTO | null>(null);
  const [batchSyncLoading, setBatchSyncLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productAdminService.getAdminProducts({
        search: search || undefined,
        category: categoryFilter || undefined,
        sync_status: syncStatusFilter || undefined,
        include_deleted: includeDeleted,
        page,
        size,
      });

      if (res.success && res.data) {
        setProducts(res.data.content);
        setTotalPages(res.data.total_pages);
        setTotalElements(res.data.total_elements);
      }
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter, syncStatusFilter, includeDeleted, page, size]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle Multi-select
  const handleToggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.product_id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Batch Re-sync
  const handleBatchSync = async () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.length > 100) {
      alert('Tối đa mỗi lượt đồng bộ hàng loạt là 100 sản phẩm!');
      return;
    }

    setBatchSyncLoading(true);
    try {
      const res = await productAdminService.triggerBatchSyncVectors(selectedIds);
      if (res.success) {
        alert(
          `Đã tiếp nhận yêu cầu Re-sync ${res.data.accepted} sản phẩm. Tiến trình đang chạy ngầm!`
        );
        setSelectedIds([]);
        loadProducts();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi kích hoạt Batch Re-sync');
    } finally {
      setBatchSyncLoading(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (product: AdminProductDTO) => {
    try {
      const newStatus = !product.is_active;
      await productAdminService.updateProductStatus(product.product_id, newStatus);
      loadProducts();
    } catch (err: any) {
      alert(err?.message || 'Không thể thay đổi trạng thái');
    }
  };

  // Soft delete product
  const handleDeleteProduct = async (product: AdminProductDTO) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn ngưng kinh doanh và xóa (Soft Delete) linh kiện "${product.name}"? Bản ghi embedding sẽ bị loại khỏi AI Search.`
      )
    ) {
      return;
    }

    try {
      await productAdminService.deleteProduct(product.product_id);
      loadProducts();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-smart-navy flex items-center gap-2">
            <Layers className="w-6 h-6 text-smart-blue" />
            <span>Quản trị Kho Linh Kiện (UC5 Product Catalog)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thông số phần cứng JSON Specs, kiểm soát xung đột phiên bản (Optimistic Locking) và trạng thái Vector Embedding AI
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchSync}
              disabled={batchSyncLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${batchSyncLoading ? 'animate-spin' : ''}`} />
              <span>Batch Re-sync ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-smart-blue hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm linh kiện mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc thương hiệu..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-smart-blue"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-smart-blue"
          >
            <option value="">-- Tất cả danh mục --</option>
            {leafCategories.map((cat) => (
              <option key={cat.category_id} value={cat.category_code}>
                {cat.category_name}
              </option>
            ))}
          </select>

          {/* Sync Status Filter */}
          <select
            value={syncStatusFilter}
            onChange={(e) => {
              setSyncStatusFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-smart-blue"
          >
            <option value="">-- Trạng thái Vector AI --</option>
            <option value="SYNCED">SYNCED (Đã vector hóa)</option>
            <option value="PENDING">PENDING (Chờ đồng bộ)</option>
            <option value="FAILED">FAILED (Đồng bộ thất bại)</option>
          </select>

          {/* Deleted check */}
          <div className="flex items-center px-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => {
                  setIncludeDeleted(e.target.checked);
                  setPage(0);
                }}
                className="w-4 h-4 rounded text-smart-blue"
              />
              <span>Bao gồm linh kiện đã xóa</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <button onClick={handleToggleSelectAll} className="text-slate-500 hover:text-smart-blue">
                    {selectedIds.length > 0 && selectedIds.length === products.length ? (
                      <CheckSquare className="w-4 h-4 text-smart-blue" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Linh kiện & Thương hiệu</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Giá bán (VND)</th>
                <th className="py-3 px-4 text-center">Kho</th>
                <th className="py-3 px-4 text-center">Kinh doanh</th>
                <th className="py-3 px-4 text-center">Vector AI</th>
                <th className="py-3 px-4 text-center">Version</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-smart-blue border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh sách linh kiện...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy linh kiện nào khớp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isSelected = selectedIds.includes(p.product_id);
                  const isDeleted = !!p.deleted_at;

                  return (
                    <tr
                      key={p.product_id}
                      className={`transition-colors hover:bg-blue-50/30 ${
                        isSelected ? 'bg-blue-50/50' : isDeleted ? 'bg-slate-50 opacity-60' : 'bg-white'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleSelectOne(p.product_id)}
                          className="text-slate-400 hover:text-smart-blue"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-smart-blue" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=100&q=80'}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200 p-0.5 flex-shrink-0"
                          />
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 line-clamp-1" title={p.name}>
                              {p.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-bold text-slate-600">{p.brand}</span>
                              {p.benchmark_score > 0 && (
                                <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  {p.benchmark_score} pts
                                </span>
                              )}
                              {isDeleted && (
                                <span className="text-smart-red font-bold">(ĐÃ XÓA)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                          {p.category.category_code}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-smart-blue">
                        {formatVND(p.price)}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span
                          className={p.stock_quantity > 0 ? 'text-slate-700' : 'text-smart-red'}
                        >
                          {p.stock_quantity}
                        </span>
                      </td>

                      {/* Active toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`p-1.5 rounded-xl border transition ${
                            p.is_active
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                          }`}
                          title={p.is_active ? 'Nhấn để ẩn sản phẩm' : 'Nhấn để kích hoạt kinh doanh'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Vector status */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <VectorSyncBadge status={p.sync_status} />
                          {p.sync_status !== 'SYNCED' && (
                            <ManualSyncButton
                              productId={p.product_id}
                              onSyncComplete={() => loadProducts()}
                            />
                          )}
                        </div>
                      </td>

                      {/* Version */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          v{p.version}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-smart-blue hover:bg-slate-100 transition"
                            title="Chỉnh sửa thông tin & specs"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!isDeleted && (
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-smart-red hover:bg-red-50 transition"
                              title="Ngưng bán (Soft delete)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Tổng số <span className="font-bold text-slate-800">{totalElements}</span> linh kiện
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-700">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        product={editingProduct}
        leafCategories={leafCategories}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={() => {
          loadProducts();
        }}
      />
    </div>
  );
};
