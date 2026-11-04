export type RuleOperator = 'EQUALS' | 'IN' | 'NOT_IN' | 'LTE' | 'GTE' | 'RANGE';

export type RuleSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface CompatRule {
  rule_id: string;
  rule_name: string;
  source_category: string;
  target_category: string;
  source_spec_key: string;
  target_spec_key: string;
  operator: RuleOperator;
  severity: RuleSeverity;
  error_message_template: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCompatRuleRequest {
  rule_name: string;
  source_category: string;
  target_category: string;
  source_spec_key: string;
  target_spec_key: string;
  operator: RuleOperator;
  severity: RuleSeverity;
  error_message_template: string;
  is_active?: boolean;
  priority?: number;
}

export interface UpdateCompatRuleRequest {
  rule_name: string;
  source_category: string;
  target_category: string;
  source_spec_key: string;
  target_spec_key: string;
  operator: RuleOperator;
  severity: RuleSeverity;
  error_message_template: string;
  is_active?: boolean;
  priority?: number;
}

export interface RuleFilterCriteria {
  source_category?: string;
  target_category?: string;
  severity?: RuleSeverity;
  is_active?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface CategoryMetadataItem {
  category_code: string;
  category_name: string;
}

export interface SpecKeyMetadataItem {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

export interface AggregateKeyMetadataItem {
  key: string;
  label: string;
  supported_operators: RuleOperator[];
}

export interface RuleSchemaMetadata {
  categories: CategoryMetadataItem[];
  spec_keys_by_category: Record<string, SpecKeyMetadataItem[]>;
  builtin_aggregate_keys: AggregateKeyMetadataItem[];
  operators: RuleOperator[];
  severities: RuleSeverity[];
  allowed_placeholders: string[];
}

export interface CompatibilityItemInput {
  product_id: string;
  quantity: number;
}

export interface DryRunRuleRequest {
  rule_definition: CreateCompatRuleRequest;
  test_items?: CompatibilityItemInput[];
  test_product_ids?: string[];
}

export interface ProductReference {
  id: string;
  name: string;
  category_code?: string;
}

export interface CompatibilityViolation {
  rule_id?: string;
  rule_name: string;
  severity: RuleSeverity;
  message: string;
  source_product: ProductReference | null;
  target_product: ProductReference | null;
}

export interface DryRunResult {
  is_compatible: boolean;
  extracted_source_value: any;
  extracted_target_value: any;
  rendered_violation_message: string | null;
  violations: CompatibilityViolation[];
  missing_spec_warnings: string[];
  execution_time_ms: number;
}

export interface CompatibilityCheckRequest {
  product_ids?: string[];
  items?: CompatibilityItemInput[];
}

export interface CompatibilityResult {
  is_compatible: boolean;
  errors: CompatibilityViolation[];
  warnings: CompatibilityViolation[];
  info: CompatibilityViolation[];
}
