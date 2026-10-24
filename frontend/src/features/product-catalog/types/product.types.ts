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

export interface FacetFilterGroupDTO {
  code: string;
  label: string;
  filter_type: 'CHIP' | 'RANGE' | 'DROPDOWN' | string;
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
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'benchmark_desc';
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
