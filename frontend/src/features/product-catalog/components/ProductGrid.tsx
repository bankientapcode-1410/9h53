import React from 'react';
import { PackageX, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { ProductSummaryDTO } from '../types/product.types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: ProductSummaryDTO[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onResetFilters?: () => void;
  onAddToCart?: (product: ProductSummaryDTO) => void;
  onAddToBuilder?: (product: ProductSummaryDTO) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  onResetFilters,
  onAddToCart,
  onAddToBuilder,
}) => {
  // Skeleton loader (8 items)
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse flex flex-col justify-between"
          >
            <div className="aspect-square w-full bg-slate-200 rounded-xl" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="flex gap-1.5 pt-2">
                <div className="h-5 w-16 bg-slate-200 rounded-md" />
                <div className="h-5 w-14 bg-slate-200 rounded-md" />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
              <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
          <PackageX className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base md:text-lg font-bold text-slate-800">
            Không tìm thấy linh kiện phù hợp
          </h3>
          <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
            Không có sản phẩm nào khớp với các tiêu chí bộ lọc đã chọn. Hãy thử điều chỉnh hoặc xóa bớt tiêu chí lọc.
          </p>
        </div>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-smart-blue hover:bg-blue-700 text-white font-semibold text-xs md:text-sm transition shadow-sm shadow-blue-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Xóa toàn bộ bộ lọc</span>
          </button>
        )}
      </div>
    );
  }

  // Render product grid
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {products.map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            onAddToCart={onAddToCart}
            onAddToBuilder={onAddToBuilder}
          />
        ))}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Hiển thị trang <span className="font-bold text-slate-700">{currentPage + 1}</span> / {totalPages}{' '}
            (Tổng cộng <span className="font-bold text-slate-700">{totalElements}</span> sản phẩm)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              // Show window around current page
              if (
                totalPages > 7 &&
                idx > 0 &&
                idx < totalPages - 1 &&
                Math.abs(idx - currentPage) > 2
              ) {
                if (idx === 1 || idx === totalPages - 2) {
                  return (
                    <span key={idx} className="px-1 text-slate-400 text-xs">
                      ...
                    </span>
                  );
                }
                return null;
              }

              const isCurrent = idx === currentPage;
              return (
                <button
                  key={idx}
                  onClick={() => onPageChange(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition shadow-sm ${
                    isCurrent
                      ? 'bg-smart-blue text-white shadow-blue-500/20'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              title="Trang kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
