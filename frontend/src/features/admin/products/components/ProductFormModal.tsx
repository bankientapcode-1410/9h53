import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import {
  AdminProductDTO,
  CreateProductRequest,
  UpdateProductRequest,
  SpecMetadataDTO,
  CategoryTreeDTO,
} from '../../../product-catalog/types/product.types';
import { categoryService } from '../../../../services/categoryService';
import { productAdminService } from '../../../../services/productAdminService';
import { DynamicSpecsEditor } from './DynamicSpecsEditor';

interface ProductFormModalProps {
  isOpen: boolean;
  product?: AdminProductDTO | null; // If provided -> Update mode, else Create mode
  leafCategories: CategoryTreeDTO[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  product,
  leafCategories,
  onClose,
  onSuccess,
}) => {
  const isEditMode = !!product;

  const [formData, setFormData] = useState<{
    name: string;
    brand: string;
    category_code: string;
    price: number;
    stock_quantity: number;
    benchmark_score: number;
    image_url: string;
    gallery_urls: string[];
    description: string;
    is_active: boolean;
    specs: Record<string, any>;
    version: number;
  }>({
    name: '',
    brand: '',
    category_code: 'CPU',
    price: 0,
    stock_quantity: 0,
    benchmark_score: 0,
    image_url: '',
    gallery_urls: [],
    description: '',
    is_active: true,
    specs: {},
    version: 0,
  });

  const [specMetadata, setSpecMetadata] = useState<SpecMetadataDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [galleryInput, setGalleryInput] = useState<string>('');

  // Populate form on edit
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        brand: product.brand,
        category_code: product.category.category_code,
        price: product.price,
        stock_quantity: product.stock_quantity,
        benchmark_score: product.benchmark_score ?? 0,
        image_url: product.image_url || '',
        gallery_urls: product.gallery_urls || [],
        description: product.description || '',
        is_active: product.is_active,
        specs: { ...(product.specs || {}) },
        version: product.version ?? 0,
      });
      setGalleryInput((product.gallery_urls || []).join('\n'));
    } else {
      const defaultCategory = leafCategories.length > 0 ? leafCategories[0].category_code : 'CPU';
      setFormData({
        name: '',
        brand: '',
        category_code: defaultCategory,
        price: 0,
        stock_quantity: 10,
        benchmark_score: 0,
        image_url: '',
        gallery_urls: [],
        description: '',
        is_active: true,
        specs: {},
        version: 0,
      });
      setGalleryInput('');
    }
    setFormErrors({});
    setGeneralError(null);
  }, [product, leafCategories, isOpen]);

  // Load SpecMetadata when category changes
  useEffect(() => {
    if (!formData.category_code) return;
    const loadSchema = async () => {
      try {
        const res = await categoryService.getCategorySpecsSchema(formData.category_code);
        if (res.success && res.data) {
          setSpecMetadata(res.data);
        }
      } catch (err) {
        console.error('Failed to load schema for', formData.category_code, err);
      }
    };
    loadSchema();
  }, [formData.category_code]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});
    setGeneralError(null);

    // Client basic checks
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.length < 3) {
      errors.name = 'Tên sản phẩm phải có từ 3 đến 255 ký tự';
    }
    if (!formData.brand.trim()) {
      errors.brand = 'Thương hiệu không được để trống';
    }
    if (formData.price <= 0) {
      errors.price = 'Giá sản phẩm phải lớn hơn 0';
    }
    if (formData.stock_quantity < 0) {
      errors.stock_quantity = 'Số lượng tồn kho không được âm';
    }
    if (formData.benchmark_score < 0 || formData.benchmark_score > 100) {
      errors.benchmark_score = 'Điểm Benchmark phải trong khoảng 0 - 100';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    const galleryUrlsParsed = galleryInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http'));

    try {
      if (isEditMode && product) {
        const payload: UpdateProductRequest = {
          name: formData.name.trim(),
          brand: formData.brand.trim().toUpperCase(),
          category_code: formData.category_code,
          price: Number(formData.price),
          stock_quantity: Number(formData.stock_quantity),
          benchmark_score: Number(formData.benchmark_score),
          image_url: formData.image_url.trim() || undefined,
          gallery_urls: galleryUrlsParsed,
          description: formData.description.trim() || undefined,
          is_active: formData.is_active,
          specs: formData.specs,
          version: formData.version,
        };

        const res = await productAdminService.updateProduct(product.product_id, payload);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setGeneralError(res.message || 'Cập nhật sản phẩm thất bại');
        }
      } else {
        const payload: CreateProductRequest = {
          name: formData.name.trim(),
          brand: formData.brand.trim().toUpperCase(),
          category_code: formData.category_code,
          price: Number(formData.price),
          stock_quantity: Number(formData.stock_quantity),
          benchmark_score: Number(formData.benchmark_score),
          image_url: formData.image_url.trim() || undefined,
          gallery_urls: galleryUrlsParsed,
          description: formData.description.trim() || undefined,
          is_active: formData.is_active,
          specs: formData.specs,
        };

        const res = await productAdminService.createProduct(payload);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setGeneralError(res.message || 'Thêm mới sản phẩm thất bại');
        }
      }
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) {
        if (data.error_code === 'PROD_CONCURRENT_MODIFICATION') {
          setGeneralError(
            'Xung đột phiên bản: Sản phẩm đã được người khác chỉnh sửa trong DB. Vui lòng tải lại trang và thử lại.'
          );
        } else if (data.errors && Array.isArray(data.errors)) {
          const mapped: Record<string, string> = {};
          data.errors.forEach((e: any) => {
            if (e.field) mapped[e.field] = e.message;
          });
          setFormErrors(mapped);
          setGeneralError(data.message || 'Dữ liệu không hợp lệ, vui lòng kiểm tra các ô báo đỏ');
        } else {
          setGeneralError(data.message || 'Đã có lỗi xảy ra');
        }
      } else {
        setGeneralError(err?.message || 'Lỗi mạng hoặc máy chủ không phản hồi');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base md:text-lg text-smart-navy">
              {isEditMode ? `Chỉnh sửa linh kiện: ${product?.name}` : 'Thêm mới linh kiện phần cứng'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? `Khóa phiên bản (Optimistic Locking): Version ${formData.version}`
                : 'Tự động kiểm tra Spec Schema và kích hoạt đồng bộ Vector AI'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {generalError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs md:text-sm text-smart-red font-semibold">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-smart-red mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-smart-navy border-b border-slate-100 pb-2">
              1. Thông tin thương mại cơ bản
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Tên sản phẩm linh kiện <span className="text-smart-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Card màn hình ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full text-xs md:text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-smart-blue/20 ${
                    formErrors.name ? 'border-smart-red bg-red-50/20' : 'border-slate-200 focus:border-smart-blue'
                  }`}
                />
                {formErrors.name && (
                  <span className="text-[11px] text-smart-red font-semibold">{formErrors.name}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Thương hiệu (Brand) <span className="text-smart-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: ASUS, MSI, INTEL, AMD..."
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value.toUpperCase() })}
                  className={`w-full text-xs md:text-sm px-3.5 py-2.5 border rounded-xl uppercase focus:outline-none focus:ring-2 focus:ring-smart-blue/20 ${
                    formErrors.brand ? 'border-smart-red bg-red-50/20' : 'border-slate-200 focus:border-smart-blue'
                  }`}
                />
                {formErrors.brand && (
                  <span className="text-[11px] text-smart-red font-semibold">{formErrors.brand}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Danh mục phần cứng <span className="text-smart-red">*</span>
                </label>
                <select
                  disabled={isEditMode}
                  value={formData.category_code}
                  onChange={(e) =>
                    setFormData({ ...formData, category_code: e.target.value, specs: {} })
                  }
                  className="w-full text-xs md:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white disabled:bg-slate-100 disabled:cursor-not-allowed focus:outline-none focus:border-smart-blue"
                >
                  {leafCategories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_code}>
                      {cat.category_name} ({cat.category_code})
                    </option>
                  ))}
                </select>
                {isEditMode && (
                  <span className="text-[11px] text-slate-400">Danh mục là bất biến sau khi tạo</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Giá bán niêm yết (VND) <span className="text-smart-red">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full text-xs md:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-smart-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Số lượng tồn kho <span className="text-smart-red">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.stock_quantity !== undefined ? formData.stock_quantity : ''}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                  className="w-full text-xs md:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-smart-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Điểm Benchmark chuẩn hóa (0 - 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.benchmark_score ?? 0}
                  onChange={(e) => setFormData({ ...formData, benchmark_score: Number(e.target.value) })}
                  className="w-full text-xs md:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-smart-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Trạng thái kinh doanh</label>
                <div className="flex items-center gap-3 pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-smart-blue focus:ring-smart-blue"
                    />
                    <span>Kích hoạt bán (Hiển thị ngoài Storefront & Search)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">URL Ảnh đại diện</label>
              <input
                type="url"
                placeholder="https://cdn.smartpc.vn/products/..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-smart-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Gallery URLs (Mỗi link một dòng, tối đa 10 ảnh)
              </label>
              <textarea
                rows={2}
                placeholder="https://...\nhttps://..."
                value={galleryInput}
                onChange={(e) => setGalleryInput(e.target.value)}
                className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-smart-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Mô tả sản phẩm</label>
              <textarea
                rows={3}
                placeholder="Giới thiệu tính năng, công nghệ tản nhiệt, bảo hành..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-smart-blue"
              />
            </div>
          </div>

          {/* Section 2: Dynamic JSON Specs Form */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-sm text-smart-navy">
              2. Thông số kỹ thuật động theo Schema
            </h4>

            <DynamicSpecsEditor
              specMetadata={specMetadata}
              values={formData.specs}
              onChange={(specs) => setFormData({ ...formData, specs })}
              errors={formErrors}
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-smart-blue hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditMode ? 'Cập nhật linh kiện' : 'Lưu sản phẩm'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
