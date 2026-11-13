// =========================================================================
// SMARTPC PRODUCT CATALOG TYPES (UC1a & UC5 - DD-UC5-PRODUCT-CATALOG)
// =========================================================================

export type ProductSyncStatus = 'SYNCED' | 'PENDING' | 'FAILED';

export type FieldType = 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY_STRING';

export interface FieldDefinitionDTO {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  filterable: boolean;
  unit?: string | null;
  minValue?: number | null;
  allowedValues?: string[] | null;
}

export interface SpecMetadataDTO {
  category_code: string;
  category_name?: string;
  has_schema: boolean;
  fields: FieldDefinitionDTO[];
}

export interface FacetOptionDTO {
  label: string;
  value: string;
  count: number;
}

export interface PriceRangePreset {
  label: string;
  value: string;
  min: number;
  max: number;
}

export const PRICE_RANGE_PRESETS: PriceRangePreset[] = [
  { label: 'Dưới 2 triệu', value: '0-2000000', min: 0, max: 2000000 },
  { label: '2 - 5 triệu', value: '2000000-5000000', min: 2000000, max: 5000000 },
  { label: '5 - 10 triệu', value: '5000000-10000000', min: 5000000, max: 10000000 },
  { label: '10 - 15 triệu', value: '10000000-15000000', min: 10000000, max: 15000000 },
  { label: '15 - 25 triệu', value: '15000000-25000000', min: 15000000, max: 25000000 },
  { label: 'Trên 25 triệu', value: '25000000-999999999', min: 25000000, max: 999999999 },
];

export const DEFAULT_PRICE_OPTIONS: FacetOptionDTO[] = PRICE_RANGE_PRESETS.map(
  ({ label, value }) => ({ label, value, count: 0 })
);

const UNBOUNDED_MAX_PRICE = 999999999;

export function buildDynamicPriceOptions(prices: number[]): FacetOptionDTO[] {
  const nonEmpty = PRICE_RANGE_PRESETS.map((preset) => {
    const count = prices.filter(
      (p) =>
        (preset.min === 0 || p >= preset.min) &&
        (preset.max >= UNBOUNDED_MAX_PRICE || p <= preset.max)
    ).length;
    return { ...preset, count };
  }).filter((bucket) => bucket.count > 0);

  if (nonEmpty.length === 0) {
    return [];
  }

  const first = nonEmpty[0];
  if (first.min > 0 && first.max < UNBOUNDED_MAX_PRICE) {
    const maxMillions = first.max / 1000000;
    nonEmpty[0] = {
      ...first,
      min: 0,
      label: `Dưới ${maxMillions} triệu`,
      value: `0-${first.max}`,
    };
  }

  if (nonEmpty.length >= 2) {
    const lastIdx = nonEmpty.length - 1;
    const last = nonEmpty[lastIdx];
    if (last.max < UNBOUNDED_MAX_PRICE && last.min > 0) {
      const minMillions = last.min / 1000000;
      nonEmpty[lastIdx] = {
        ...last,
        max: UNBOUNDED_MAX_PRICE,
        label: `Trên ${minMillions} triệu`,
        value: `${last.min}-${UNBOUNDED_MAX_PRICE}`,
      };
    }
  }

  return nonEmpty.map(({ label, value, count }) => ({ label, value, count }));
}

export interface FacetFilterGroupDTO {
  code?: string;
  label?: string;
  group_key?: string;
  group_label?: string;
  filter_type?: 'CHIP' | 'RANGE' | 'DROPDOWN' | string;
  options: FacetOptionDTO[];
  min_price?: number;
  max_price?: number;
}

export interface ProductSummaryDTO {
  product_id: string;
  name: string;
  brand: string;
  category_code: string;
  category_name: string;
  image_url: string;
  price: number;
  in_stock: boolean;
  benchmark_score: number;
  key_specs: Record<string, string | number | boolean | string[]>;
}

export interface CategorySummaryDTO {
  category_id: string;
  category_code: string;
  category_name: string;
}

export interface ProductDetailDTO {
  product_id: string;
  name: string;
  brand: string;
  category: CategorySummaryDTO;
  description: string;
  price: number;
  in_stock: boolean;
  benchmark_score: number;
  image_url: string;
  gallery_urls: string[];
  specs: Record<string, any>;
  spec_labels: Record<string, { label: string; unit?: string | null }>;
  created_at?: string;
}

export interface AdminProductDTO {
  product_id: string;
  name: string;
  brand: string;
  category: CategorySummaryDTO;
  description?: string;
  image_url?: string;
  gallery_urls?: string[];
  price: number;
  stock_quantity: number;
  benchmark_score: number;
  specs: Record<string, any>;
  is_active: boolean;
  sync_status: ProductSyncStatus;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CategoryTreeDTO {
  category_id: string;
  category_code: string;
  category_name: string;
  description?: string | null;
  parent_category_id?: string | null;
  has_schema?: boolean;
  children: CategoryTreeDTO[];
}

export interface VectorSyncResultDTO {
  product_id: string;
  sync_status: ProductSyncStatus;
  embedding_model: string;
  vector_dimensions: number;
  synced_at: string;
}

export interface RejectedBatchItem {
  product_id: string;
  reason: string;
}

export interface BatchSyncAcceptedDTO {
  job_id: string;
  accepted: number;
  rejected: RejectedBatchItem[];
}

export interface BatchResyncRequest {
  product_ids: string[];
}

export interface ProductFilterCriteria {
  category?: string;
  brand?: string | string[];
  min_price?: number;
  max_price?: number;
  specs?: Record<string, string>;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
  page?: number;
  size?: number;
  search?: string;
  sync_status?: ProductSyncStatus;
  include_deleted?: boolean;
}

export interface CreateProductRequest {
  name: string;
  brand: string;
  category_code: string;
  description?: string;
  image_url?: string;
  gallery_urls?: string[];
  price: number;
  stock_quantity: number;
  benchmark_score?: number;
  is_active?: boolean;
  specs: Record<string, any>;
}

export interface UpdateProductRequest extends CreateProductRequest {
  version: number;
}

export interface UpdateProductStatusRequest {
  is_active: boolean;
}

export interface CreateCategoryRequest {
  category_code: string;
  category_name: string;
  description?: string;
  parent_category_id?: string | null;
}

export interface UpdateCategoryRequest {
  category_name: string;
  description?: string;
  parent_category_id?: string | null;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  status_code: number;
  message: string;
  data: T;
  error_code?: string;
  errors?: ApiErrorDetail[];
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
}
