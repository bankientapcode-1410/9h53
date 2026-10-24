import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ShoppingCart,
  Wrench,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Truck,
  RotateCcw,
  Cpu,
  ArrowLeft,
} from 'lucide-react';
import { useProductDetail } from '../hooks/useProductDetail';
import { ProductSpecsTable } from '../components/ProductSpecsTable';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, isLoading, error } = useProductDetail(id);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = () => {
    if (!product || !product.in_stock) return;
    showToast(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const handleAddToBuilder = () => {
    if (!product) return;
    showToast(`Đã đưa linh kiện vào khe cắm ${product.category.category_code} trong PC Builder!`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 animate-pulse">
        <div className="h-5 w-64 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="h-8 w-3/4 bg-slate-200 rounded" />
            <div className="h-10 w-48 bg-slate-200 rounded" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
            <div className="h-12 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-red-50 text-smart-red rounded-2xl mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy sản phẩm</h2>
        <p className="text-sm text-slate-500">
          {error || 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh trên hệ thống SmartPC.'}
        </p>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-smart-blue text-white font-bold text-sm hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh mục sản phẩm</span>
        </button>
      </div>
    );
  }

  const allImages = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);
  const activeImage = selectedImage || allImages[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-smart-navy text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs md:text-sm text-slate-500 font-medium">
        <Link to="/" className="hover:text-smart-blue transition">
          Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/products" className="hover:text-smart-blue transition">
          Linh kiện
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link
          to={`/products?category=${product.category.category_code}`}
          className="hover:text-smart-blue transition text-slate-600"
        >
          {product.category.category_name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-smart-navy font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Product Main Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gallery (Left: 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square bg-slate-50 rounded-2xl border border-slate-200 p-6 flex items-center justify-center overflow-hidden">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80';
              }}
            />
            {product.benchmark_score > 0 && (
              <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-xl shadow flex items-center gap-1">
                <Flame className="w-4 h-4 fill-white" />
                Benchmark: {product.benchmark_score} pts
              </div>
            )}
            {!product.in_stock && (
              <div className="absolute top-4 right-4 bg-smart-red text-white text-xs font-black px-3 py-1 rounded-xl shadow uppercase">
                HẾT HÀNG
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl border-2 p-1 bg-white flex-shrink-0 transition overflow-hidden ${
                    activeImage === img ? 'border-smart-blue shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Actions (Right: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-smart-blue border border-blue-200 text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {product.brand}
              </span>
              <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                {product.category.category_name}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Giá bán chính hãng:</span>
                <span className="text-2xl md:text-3xl font-black text-smart-blue">
                  {formatVND(product.price)}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    product.in_stock
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-smart-red'
                  }`}
                >
                  {product.in_stock ? 'Còn hàng' : 'Tạm thời hết hàng'}
                </span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="text-xs md:text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                <p>{product.description}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!product.in_stock}
                className={`py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                  product.in_stock
                    ? 'bg-smart-blue hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-95'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{product.in_stock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}</span>
              </button>

              <button
                onClick={handleAddToBuilder}
                className="py-3.5 px-6 rounded-2xl font-bold text-sm bg-white hover:bg-blue-50 text-smart-blue flex items-center justify-center gap-2 shadow-sm border-2 border-smart-blue/80 transition active:scale-95"
              >
                <Wrench className="w-5 h-5 text-smart-blue" />
                <span>+ Đưa vào PC Builder</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-slate-600 text-[11px] font-medium">
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100% Chính hãng</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Giao hàng 2H</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <RotateCcw className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Đổi mới 7 ngày</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <Cpu className="w-4 h-4 text-smart-blue flex-shrink-0" />
                <span>Rule Check 2ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Specs Section */}
      <div className="space-y-4">
        <ProductSpecsTable
          specs={product.specs}
          specLabels={product.spec_labels}
          categoryName={product.category.category_name}
        />
      </div>
    </div>
  );
};
