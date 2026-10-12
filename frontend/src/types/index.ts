// ==========================================
// SmartPC Core Types based on prj1.md ERD
// ==========================================

export type CategoryCode = 
  | 'CPU' 
  | 'MOTHERBOARD' 
  | 'RAM' 
  | 'GPU' 
  | 'SSD_M2' 
  | 'PSU' 
  | 'CASE' 
  | 'CPU_COOLER';

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  specs: Record<string, any>;
  imageUrl: string;
  price: number;
  stockQuantity: number;
  benchmarkScore: number;
  categoryCode: CategoryCode;
  isActive: boolean;
}

export type Severity = 'ERROR' | 'WARNING' | 'INFO';

export interface ViolationDetail {
  rule_name: string;
  severity: Severity;
  message: string;
  source_product?: { id: string; name: string };
  target_product?: { id: string; name: string };
}

export interface CompatibilityResult {
  is_compatible: boolean;
  errors: ViolationDetail[];
  warnings: ViolationDetail[];
  info: ViolationDetail[];
}

export interface PCBuilderState {
  cpu: Product | null;
  motherboard: Product | null;
  ram: Product[];
  gpu: Product | null;
  storage: Product[];
  psu: Product | null;
  case: Product | null;
  cooler: Product | null;
  totalPrice: number;
  estimatedTdp: number;
  compatibilityResult: CompatibilityResult | null;
}
