import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
  XCircle,
} from 'lucide-react';
import type {
  AllBuilderSlotCode,
  BuildItemInput,
  CandidateProductDTO,
  CandidateSortOption,
  SlotCandidateSearchRequest,
} from '@/features/pc-builder/types/builder.types';
import { ALL_SLOT_CONFIG_MAP } from '@/features/pc-builder/constants/slotConfig';
import type {
  FacetFilterGroupDTO,
  ProductSummaryDTO,
} from '@/features/product-catalog/types/product.types';
import { pcBuilderService } from '@/services/pcBuilderService';
import { productService } from '@/services/productService';
import { getProductImageFallback } from '@/utils/productImageFallback';

interface ComponentPickerModalProps {
  isOpen: boolean;
  slotCode: AllBuilderSlotCode | null;
  currentItems: BuildItemInput[];
  onSelectProduct: (slotCode: AllBuilderSlotCode, product: ProductSummaryDTO) => void;
  onClose: () => void;
}

const formatVnd = (price: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(price)}đ`;

const PAGE_SIZE = 12;

export const ComponentPickerModal: React.FC<ComponentPickerModalProps> = ({
  isOpen,
  slotCode,
  currentItems,
  onSelectProduct,
  onClose,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRangeKey, setPriceRangeKey] = useState<string | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<CandidateSortOption>('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [compatibleOnly, setCompatibleOnly] = useState(false);
  const [page, setPage] = useState(0);

  const [facets, setFacets] = useState<FacetFilterGroupDTO[]>([]);
  const [candidates, setCandidates] = useState<CandidateProductDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset filters whenever modal opens for a slot
  useEffect(() => {
    if (!isOpen || !slotCode) return;
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedBrands([]);
    setPriceRangeKey(null);
    setSelectedSpecs({});
    setSort('newest');
    setInStockOnly(false);
    setCompatibleOnly(false);
    setPage(0);
    setErrorMessage(null);

    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(focusTimer);
  }, [isOpen, slotCode]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load facets for the active category
  useEffect(() => {
    if (!isOpen || !slotCode) return;
    let cancelled = false;

    const loadFacets = async () => {
      try {
        const res = await productService.getFacets(slotCode);
        if (!cancelled && res.success && res.data) {
          setFacets(res.data);
        }
      } catch {
        if (!cancelled) {
          setFacets([]);
        }
      }
    };

    void loadFacets();
    return () => {
      cancelled = true;
    };
  }, [isOpen, slotCode]);

  // Fetch candidates whenever filters or pagination change
  useEffect(() => {
    if (!isOpen || !slotCode) return;
    const controller = new AbortController();

    const fetchCandidates = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      let minPrice: number | undefined;
      let maxPrice: number | undefined;
      if (priceRangeKey) {
        const [minStr, maxStr] = priceRangeKey.split('-');
        const parsedMin = Number(minStr);
        const parsedMax = Number(maxStr);
        if (Number.isFinite(parsedMin) && parsedMin > 0) minPrice = parsedMin;
        if (Number.isFinite(parsedMax) && parsedMax < 999999999) maxPrice = parsedMax;
      }

      const payload: SlotCandidateSearchRequest = {
        current_items: currentItems,
        search: debouncedSearch || undefined,
        brand: selectedBrands.length > 0 ? selectedBrands : undefined,
        min_price: minPrice,
        max_price: maxPrice,
        specs: Object.keys(selectedSpecs).length > 0 ? selectedSpecs : undefined,
        compatible_only: compatibleOnly,
        evaluate_compatibility: currentItems.length > 0,
        in_stock_only: inStockOnly,
        sort,
        page,
        size: PAGE_SIZE,
      };

      try {
        const res = await pcBuilderService.searchSlotCandidates(
          slotCode,
          payload,
          controller.signal
        );
        if (res.success && res.data) {
          setCandidates(res.data.content || []);
          setTotalElements(res.data.total_elements ?? 0);
          setTotalPages(res.data.total_pages ?? 0);
        } else {
          setCandidates([]);
          setErrorMessage(res.message || 'Không thể tải danh sách linh kiện.');
        }
      } catch (err) {
        const errObj = err as { code?: string; name?: string } | null;
        if (errObj?.code === 'ERR_CANCELED' || errObj?.name === 'AbortError') {
          return;
        }
        setCandidates([]);
        setErrorMessage('Đã xảy ra lỗi khi tải danh sách linh kiện ứng viên.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchCandidates();
    return () => controller.abort();
  }, [
    isOpen,
    slotCode,
    currentItems,
    debouncedSearch,
    selectedBrands,
    priceRangeKey,
    selectedSpecs,
    compatibleOnly,
    inStockOnly,
    sort,
    page,
  ]);

  if (!isOpen || !slotCode) {
    return null;
  }

  const slotMeta = ALL_SLOT_CONFIG_MAP[slotCode];

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setPage(0);
  };

  const togglePriceRange = (val: string) => {
    setPriceRangeKey((prev) => (prev === val ? null : val));
    setPage(0);
  };

  const toggleSpecFilter = (key: string, val: string) => {
    setSelectedSpecs((prev) => {
      const next = { ...prev };
      if (next[key] === val) {
        delete next[key];
      } else {
        next[key] = val;
      }
      return next;
    });
    setPage(0);
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedBrands([]);
    setPriceRangeKey(null);
    setSelectedSpecs({});
    setInStockOnly(false);
    setCompatibleOnly(false);
    setSort('newest');
    setPage(0);
  };

  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    selectedBrands.length > 0 ||
    Boolean(priceRangeKey) ||
    Object.keys(selectedSpecs).length > 0 ||
    inStockOnly ||
    compatibleOnly;

  const canReset = hasActiveFilters || sort !== 'newest';

  const brandGroup = facets.find(
    (g) => (g.group_key || g.code) === 'brand'
  );
  const priceGroup = facets.find((g) => {
    const k = g.group_key || g.code;
    return k === 'price' || k === 'price_ranges';
  });
  const specGroups = facets.filter((g) => {
    const k = g.group_key || g.code;
    return k && k !== 'brand' && k !== 'price' && k !== 'price_ranges';
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="component-picker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="component-picker-title"
                className="text-base sm:text-lg font-black text-smart-navy"
              >
                Chọn {slotMeta?.display_name || slotCode}
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-smart-blue border border-blue-200">
                {totalElements} sản phẩm
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tìm kiếm theo tên, thông số kỹ thuật hoặc lọc nhanh các linh kiện tương thích
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp chọn linh kiện"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center gap-2.5">
            {/* Search Input */}
            <div className="flex-1 min-w-0 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={`Tìm ${slotMeta?.short_name || slotCode} (VD: B760, RTX 4060, DDR5...)`}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 focus:border-smart-blue focus:ring-2 focus:ring-smart-blue/15 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort & Quick Toggles */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as CandidateSortOption);
                  setPage(0);
                }}
                aria-label="Sắp xếp ứng viên"
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:border-smart-blue outline-none shrink-0"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>

              <button
                type="button"
                aria-pressed={inStockOnly}
                onClick={() => {
                  setInStockOnly((v) => !v);
                  setPage(0);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 transition ${
                  inStockOnly
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Còn hàng</span>
              </button>

              <button
                type="button"
                aria-pressed={compatibleOnly}
                onClick={() => {
                  setCompatibleOnly((v) => !v);
                  setPage(0);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 transition ${
                  compatibleOnly
                    ? 'bg-smart-blue text-white border-smart-blue shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-smart-blue'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Chỉ hiện tương thích</span>
              </button>

              <button
                type="button"
                onClick={resetAllFilters}
                disabled={!canReset}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap shrink-0 transition ${
                  canReset
                    ? 'bg-white text-slate-700 border-slate-200 hover:text-smart-red hover:border-red-200 hover:bg-red-50 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>

          {/* Facet Chips: Brand, Price & Category Specs */}
          {facets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 mr-1">
                <SlidersHorizontal className="w-3 h-3" />
                Lọc nhanh:
              </span>

              {brandGroup?.options?.slice(0, 6).map((opt) => {
                const active = selectedBrands.includes(opt.value);
                return (
                  <button
                    key={`brand-${opt.value}`}
                    type="button"
                    onClick={() => toggleBrand(opt.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                      active
                        ? 'bg-smart-navy text-white border-smart-navy'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-smart-blue'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}

              {priceGroup?.options?.slice(0, 4).map((opt) => {
                const active = priceRangeKey === opt.value;
                return (
                  <button
                    key={`price-${opt.value}`}
                    type="button"
                    onClick={() => togglePriceRange(opt.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                      active
                        ? 'bg-smart-blue text-white border-smart-blue'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-smart-blue'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}

              {specGroups.slice(0, 3).map((group) => {
                const groupKey = group.group_key || group.code || '';
                const groupLabel = group.group_label || group.label || groupKey;
                return group.options?.slice(0, 4).map((opt) => {
                  const active = selectedSpecs[groupKey] === opt.value;
                  return (
                    <button
                      key={`spec-${groupKey}-${opt.value}`}
                      type="button"
                      onClick={() => toggleSpecFilter(groupKey, opt.value)}
                      title={`${groupLabel}: ${opt.label}`}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                        active
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                });
              })}
            </div>
          )}
        </div>

        {/* Scrollable Candidate List */}
        <div className="flex-1 overflow-y-auto p-5 bg-smart-bg">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-7 h-7 text-smart-blue animate-spin" />
              <span className="text-xs font-semibold">
                Đang tìm kiếm linh kiện phù hợp...
              </span>
            </div>
          ) : errorMessage ? (
            <div className="py-14 text-center space-y-2">
              <XCircle className="w-8 h-8 text-smart-red mx-auto" />
              <p className="text-sm font-bold text-slate-700">{errorMessage}</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">
                Không tìm thấy linh kiện phù hợp với bộ lọc hiện tại.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-smart-blue text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc để xem tất cả</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {candidates.map((candidate) => {
                const { product, compat_status, compat_summary } = candidate;
                const specEntries = Object.entries(product.key_specs || {}).slice(0, 4);

                return (
                  <div
                    key={product.product_id}
                    className={`rounded-2xl bg-white border p-4 flex flex-col justify-between gap-3 transition shadow-sm hover:shadow-md ${
                      compat_status === 'ERROR'
                        ? 'border-red-200 hover:border-smart-red/60'
                        : compat_status === 'WARNING'
                          ? 'border-amber-200 hover:border-amber-400'
                          : 'border-slate-200 hover:border-smart-blue/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img
                          src={
                            product.image_url ||
                            getProductImageFallback(product.category_code)
                          }
                          alt={product.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              getProductImageFallback(product.category_code);
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {product.brand}
                          </span>
                          {product.benchmark_score > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              <Flame className="w-2.5 h-2.5 text-amber-500" />
                              {product.benchmark_score} pts
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              product.in_stock
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-smart-red border border-red-200'
                            }`}
                          >
                            {product.in_stock ? 'Còn hàng' : 'Hết hàng'}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
                          {product.name}
                        </h3>

                        {specEntries.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {specEntries.map(([k, v]) => (
                              <span
                                key={k}
                                className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/70"
                              >
                                {Array.isArray(v) ? v.join(', ') : String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Compatibility status & CTA */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-black text-smart-blue">
                          {formatVnd(product.price)}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] truncate">
                          {compat_status === 'ERROR' ? (
                            <span
                              title={compat_summary}
                              className="inline-flex items-center gap-1 text-smart-red font-semibold truncate"
                            >
                              <XCircle className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{compat_summary}</span>
                            </span>
                          ) : compat_status === 'WARNING' ? (
                            <span
                              title={compat_summary}
                              className="inline-flex items-center gap-1 text-amber-700 font-semibold truncate"
                            >
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{compat_summary}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                              <span>Tương thích</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectProduct(slotCode, product);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-smart-blue hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-sm flex-shrink-0 active:scale-95"
                      >
                        Chọn
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Pagination */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 font-medium">
            Hiển thị {candidates.length} / {totalElements} linh kiện
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 0 || isLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>
            <span className="font-bold text-smart-navy px-2">
              Trang {totalPages > 0 ? page + 1 : 0} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
