import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { ProductFilterCriteria } from '../types/product.types';

export function useProductFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const filters: ProductFilterCriteria = useMemo(() => {
    const category = searchParams.get('category') || undefined;
    const brandParam = searchParams.get('brand');
    const brand = brandParam ? brandParam.split(',').filter(Boolean) : undefined;

    const rawMin = searchParams.get('min_price');
    const parsedMin = rawMin ? Number(rawMin) : undefined;
    const minPrice =
      parsedMin !== undefined && parsedMin > 0 && Number.isFinite(parsedMin)
        ? parsedMin
        : undefined;

    const rawMax = searchParams.get('max_price');
    const parsedMax = rawMax ? Number(rawMax) : undefined;
    const maxPrice =
      parsedMax !== undefined && parsedMax < 999999999 && Number.isFinite(parsedMax)
        ? parsedMax
        : undefined;

    const sort = (searchParams.get('sort') as any) || 'newest';
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 0;
    const size = searchParams.get('size') ? Number(searchParams.get('size')) : 12;
    const search = searchParams.get('search') || undefined;

    // Parse specs[...]
    const specs: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      const match = key.match(/^specs\[(.*?)\]$/);
      if (match && match[1] && value) {
        specs[match[1]] = value;
      }
    }

    return {
      category,
      brand,
      min_price: minPrice,
      max_price: maxPrice,
      specs: Object.keys(specs).length > 0 ? specs : undefined,
      sort,
      page,
      size,
      search,
    };
  }, [searchParams]);

  // Update URL helper
  const updateParams = useCallback(
    (newParams: Record<string, string | null | undefined>, resetPage = true) => {
      const current = new URLSearchParams(searchParams);

      Object.entries(newParams).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') {
          current.delete(k);
        } else {
          current.set(k, v);
        }
      });

      if (resetPage && !('page' in newParams)) {
        current.delete('page');
      }

      setSearchParams(current, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  const setCategory = useCallback(
    (catCode: string | null) => {
      const current = new URLSearchParams();
      // Keep search or sort if desired, but clear category specific specs
      if (catCode) {
        current.set('category', catCode);
      }
      const sort = searchParams.get('sort');
      if (sort && sort !== 'newest') current.set('sort', sort);
      const search = searchParams.get('search');
      if (search) current.set('search', search);

      setSearchParams(current);
    },
    [searchParams, setSearchParams]
  );

  const toggleBrand = useCallback(
    (brandName: string) => {
      if (!brandName) {
        updateParams({ brand: null });
        return;
      }
      const currentBrands = Array.isArray(filters.brand) ? [...filters.brand] : [];
      const index = currentBrands.findIndex((b) => b.toUpperCase() === brandName.toUpperCase());

      if (index >= 0) {
        currentBrands.splice(index, 1);
      } else {
        currentBrands.push(brandName);
      }

      updateParams({
        brand: currentBrands.length > 0 ? currentBrands.join(',') : null,
      });
    },
    [filters.brand, updateParams]
  );

  const clearBrands = useCallback(() => {
    updateParams({ brand: null });
  }, [updateParams]);

  const toggleSpec = useCallback(
    (specKey: string, value: string) => {
      const paramKey = `specs[${specKey}]`;
      if (!value) {
        updateParams({ [paramKey]: null });
        return;
      }

      const currentSpecs = { ...(filters.specs || {}) };
      const currentVal = currentSpecs[specKey] !== undefined ? String(currentSpecs[specKey]) : '';
      const values = currentVal ? currentVal.split(',').filter(Boolean) : [];

      const idx = values.indexOf(value);
      if (idx >= 0) {
        values.splice(idx, 1);
      } else {
        values.push(value);
      }

      if (values.length > 0) {
        updateParams({ [paramKey]: values.join(',') });
      } else {
        updateParams({ [paramKey]: null });
      }
    },
    [filters.specs, updateParams]
  );

  const clearSpec = useCallback(
    (specKey: string) => {
      updateParams({ [`specs[${specKey}]`]: null });
    },
    [updateParams]
  );

  const setPriceRange = useCallback(
    (min?: number, max?: number) => {
      const validMin =
        min !== undefined && min > 0 && Number.isFinite(min) ? String(min) : null;
      const validMax =
        max !== undefined && max < 999999999 && Number.isFinite(max) ? String(max) : null;
      updateParams({
        min_price: validMin,
        max_price: validMax,
      });
    },
    [updateParams]
  );

  const setSort = useCallback(
    (sort: 'newest' | 'price_asc' | 'price_desc' | 'benchmark_desc') => {
      updateParams({ sort: sort === 'newest' ? null : sort }, false);
    },
    [updateParams]
  );

  const setPage = useCallback(
    (page: number) => {
      updateParams({ page: page > 0 ? String(page) : null }, false);
    },
    [updateParams]
  );

  const setSearch = useCallback(
    (search: string) => {
      updateParams({ search: search.trim() ? search.trim() : null });
    },
    [updateParams]
  );

  const resetFilters = useCallback(() => {
    const current = new URLSearchParams();
    if (filters.category) current.set('category', filters.category);
    setSearchParams(current);
  }, [filters.category, setSearchParams]);

  return {
    filters,
    setCategory,
    toggleBrand,
    clearBrands,
    toggleSpec,
    clearSpec,
    setPriceRange,
    setSort,
    setPage,
    setSearch,
    resetFilters,
  };
}
