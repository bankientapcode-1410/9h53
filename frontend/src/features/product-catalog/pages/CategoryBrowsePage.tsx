import React, { useEffect, useState, useCallback } from 'react';
import { Search, Sparkles, Filter, ShieldCheck, Zap, Cpu } from 'lucide-react';
import { useCategoryStore } from '../../../stores/useCategoryStore';
import { useProductFilter } from '../hooks/useProductFilter';
import { productService } from '../../../services/productService';
import { categoryService } from '../../../services/categoryService';
import {
  ProductSummaryDTO,
  FacetFilterGroupDTO,
  SpecMetadataDTO,
} from '../types/product.types';

import { CategoryHierarchyNav } from '../components/CategoryHierarchyNav';
import { QuickChipsFilterBar } from '../components/QuickChipsFilterBar';
import { DynamicSpecsFilterPanel } from '../components/DynamicSpecsFilterPanel';
import { SortDropdown, SortValue } from '../components/SortDropdown';
import { ProductGrid } from '../components/ProductGrid';

export const CategoryBrowsePage: React.FC = () => {
  const { categories, fetchCategories } = useCategoryStore();
  const {
    filters,
    setCategory,
    toggleBrand,
    toggleSpec,
    setPriceRange,
    setSort,
    setPage,
    setSearch,
    resetFilters,
  } = useProductFilter();

  const [products, setProducts] = useState<ProductSummaryDTO[]>([]);
  const [facets, setFacets] = useState<FacetFilterGroupDTO[]>([]);
  const [specMetadata, setSpecMetadata] = useState<SpecMetadataDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');

  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  // Load category tree on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Load facets and specs schema when category changes
  useEffect(() => {
    const loadCategoryMetadata = async () => {
      if (filters.category) {
        try {
          const [facetRes, specRes] = await Promise.all([
            productService.getFacets(filters.category),
            categoryService.getCategorySpecsSchema(filters.category),
          ]);
          if (facetRes.success && facetRes.data) {
            setFacets(facetRes.data);
          }
          if (specRes.success && specRes.data) {
            setSpecMetadata(specRes.data);
          }
        } catch (err) {
          console.error('Error loading facets/specs schema:', err);
        }
      } else {
        // Fallback generic facets when no specific category is selected
        setFacets([
          {
            code: 'brand',
            label: 'Thương hiệu phổ biến',
            filter_type: 'CHIP',
            options: [
              { label: 'ASUS', value: 'ASUS', count: 0 },
              { label: 'MSI', value: 'MSI', count: 0 },
              { label: 'INTEL', value: 'INTEL', count: 0 },
              { label: 'AMD', value: 'AMD', count: 0 },
              { label: 'CORSAIR', value: 'CORSAIR', count: 0 },
            ],
          },
          {
            code: 'price_ranges',
            label: 'Khoảng giá',
            filter_type: 'CHIP',
            options: [
              { label: 'Dưới 5 triệu', value: '0-5000000', count: 0 },
              { label: '5 - 15 triệu', value: '5000000-15000000', count: 0 },
              { label: 'Trên 15 triệu', value: '15000000-999999999', count: 0 },
            ],
          },
        ]);
        setSpecMetadata(null);
      }
    };

    loadCategoryMetadata();
  }, [filters.category]);

  // Fetch product list
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await productService.getProducts(filters);
      if (response.success && response.data) {
        setProducts(response.data.content);
        setTotalPages(response.data.total_pages);
        setTotalElements(response.data.total_elements);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Bright Search Header Banner (matching docs/screens/screen1.png) */}
      <div className="bg-gradient-to-r from-[#FFFDF7] via-[#F9F5EB] to-[#EFF6FF] border border-amber-200/70 rounded-3xl p-6 md:p-8 text-smart-navy shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-smart-blue text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-smart-blue" />
            <span>SmartPC Catalog — Duyệt linh kiện chuẩn xác & Kiểm tra tương thích</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-smart-navy">
            Kho Linh Kiện Máy Tính Chính Hãng
          </h1>

          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Tất cả linh kiện đều được định danh thông số kỹ thuật chuẩn hóa, tự động kiểm tra tương thích Socket, Bus RAM và Công suất nguồn trong thời gian thực.
          </p>

          {/* Feature Highlights (Bright White Pills matching screen1.png) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-xs text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-smart-blue" />
              <span>Bảo hành 36T tận nơi</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-xs text-xs font-semibold text-slate-700">
              <Cpu className="w-4 h-4 text-amber-600" />
              <span>Rule-check &lt; 2ms</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-xs text-xs font-semibold text-slate-700">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Nâng cấp vượt trội</span>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl pt-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm linh kiện theo tên, thương hiệu, thông số (VD: RTX 4060, i5-13600K, DDR5...)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-28 py-3 bg-white border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-smart-blue focus:ring-2 focus:ring-smart-blue/15 transition shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-2 bg-smart-blue hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Hierarchy Navigation */}
      <CategoryHierarchyNav
        categories={categories}
        selectedCategoryCode={filters.category}
        onSelectCategory={setCategory}
      />

      {/* Quick Chips Filter Bar */}
      <QuickChipsFilterBar
        facets={facets}
        activeBrands={Array.isArray(filters.brand) ? filters.brand : filters.brand ? [filters.brand] : []}
        activeSpecs={filters.specs}
        minPrice={filters.min_price}
        maxPrice={filters.max_price}
        onToggleBrand={toggleBrand}
        onToggleSpec={toggleSpec}
        onSetPriceRange={setPriceRange}
        onResetFilters={resetFilters}
      />

      {/* Dynamic Specs Filter Panel (if category is selected and has schema) */}
      {filters.category && specMetadata && (
        <DynamicSpecsFilterPanel
          specMetadata={specMetadata}
          activeSpecs={filters.specs}
          onToggleSpec={toggleSpec}
          onClearSpecs={resetFilters}
        />
      )}

      {/* Toolbar: Product Count & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-smart-blue" />
          <span className="text-xs md:text-sm font-semibold text-slate-700">
            Tìm thấy{' '}
            <span className="font-extrabold text-smart-blue text-sm md:text-base">
              {totalElements}
            </span>{' '}
            sản phẩm linh kiện
          </span>
          {filters.category && (
            <span className="bg-blue-50 text-smart-blue text-xs font-bold px-2 py-0.5 rounded-lg border border-blue-200">
              {filters.category}
            </span>
          )}
        </div>

        <SortDropdown
          value={(filters.sort as SortValue) || 'newest'}
          onChange={(val) => setSort(val)}
        />
      </div>

      {/* Main Product Grid */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        currentPage={filters.page || 0}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
        onResetFilters={resetFilters}
      />
    </div>
  );
};
