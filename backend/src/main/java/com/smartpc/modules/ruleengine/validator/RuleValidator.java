package com.smartpc.modules.ruleengine.validator;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.FieldErrorDTO;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.schema.FieldDefinition;
import com.smartpc.modules.product.schema.FieldType;
import com.smartpc.modules.ruleengine.dto.request.CreateCompatRuleRequest;
import com.smartpc.modules.ruleengine.dto.request.UpdateCompatRuleRequest;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.repository.CompatRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class RuleValidator {

    public static final String SYSTEM_CATEGORY = "_SYSTEM";

    private static final Pattern SPEC_KEY_PATTERN = Pattern.compile("^[a-z_][a-z0-9_]{1,99}$");
    private static final Pattern DYNAMIC_AGG_PATTERN = Pattern.compile("^(_sum_|_max_)([a-z][a-z0-9_]*)$");
    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{([^{}]*)\\}");

    public static final Set<String> BUILTIN_AGGREGATE_KEYS = Set.of(
            "_count", "_sum_capacity_gb", "_total_tdp_w"
    );

    public static final Set<String> ALLOWED_PLACEHOLDERS = Set.of(
            "source_name", "target_name", "source_value", "target_value",
            "source_category", "target_category"
    );

    private static final Set<RuleOperator> NUMERIC_OPERATORS = EnumSet.of(
            RuleOperator.LTE, RuleOperator.GTE, RuleOperator.EQUALS, RuleOperator.RANGE
    );

    private final CategoryRepository categoryRepository;
    private final CategorySpecSchemaRegistry specSchemaRegistry;
    private final CompatRuleRepository compatRuleRepository;

    public void validateForCreate(CreateCompatRuleRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Payload yêu cầu không được để trống");
        }
        validateRule(
                request.getSourceCategory(),
                request.getTargetCategory(),
                request.getSourceSpecKey(),
                request.getTargetSpecKey(),
                request.getOperator(),
                request.getErrorMessageTemplate(),
                null,
                true
        );
    }

    public void validateForUpdate(String ruleId, UpdateCompatRuleRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Payload yêu cầu không được để trống");
        }
        validateRule(
                request.getSourceCategory(),
                request.getTargetCategory(),
                request.getSourceSpecKey(),
                request.getTargetSpecKey(),
                request.getOperator(),
                request.getErrorMessageTemplate(),
                ruleId,
                true
        );
    }

    public void validateForDryRun(CreateCompatRuleRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Định nghĩa quy tắc không được để trống");
        }
        validateRule(
                request.getSourceCategory(),
                request.getTargetCategory(),
                request.getSourceSpecKey(),
                request.getTargetSpecKey(),
                request.getOperator(),
                request.getErrorMessageTemplate(),
                null,
                false
        );
    }

    public void validateRule(
            String sourceCategory,
            String targetCategory,
            String sourceSpecKey,
            String targetSpecKey,
            RuleOperator operator,
            String errorMessageTemplate,
            String excludeRuleId,
            boolean checkDuplicate
    ) {
        // 1. Validate Categories
        if (sourceCategory == null || targetCategory == null) {
            throw new BusinessException(ErrorCode.RULE_INVALID_CATEGORY, "Danh mục nguồn và danh mục đích không được để trống");
        }
        String srcCat = sourceCategory.trim().toUpperCase();
        String tgtCat = targetCategory.trim().toUpperCase();

        if (srcCat.equals(tgtCat)) {
            throw new BusinessException(ErrorCode.RULE_SELF_REFERENCE,
                    "Danh mục nguồn và danh mục đích không được trùng nhau (" + srcCat + ")",
                    List.of(new FieldErrorDTO("target_category", "Không được trùng với source_category")));
        }

        if (!SYSTEM_CATEGORY.equals(srcCat)
                && (!categoryRepository.existsByCategoryCode(srcCat) || !specSchemaRegistry.hasCategory(srcCat))) {
            throw new BusinessException(ErrorCode.RULE_INVALID_CATEGORY,
                    "Danh mục nguồn không tồn tại hoặc chưa đăng ký schema thông số: " + srcCat,
                    List.of(new FieldErrorDTO("source_category", "Danh mục nguồn không hợp lệ")));
        }

        if (!categoryRepository.existsByCategoryCode(tgtCat) || !specSchemaRegistry.hasCategory(tgtCat)) {
            throw new BusinessException(ErrorCode.RULE_INVALID_CATEGORY,
                    "Danh mục đích không tồn tại hoặc chưa đăng ký schema thông số: " + tgtCat,
                    List.of(new FieldErrorDTO("target_category", "Danh mục đích không hợp lệ")));
        }

        // 2. Validate Spec Keys
        String srcKey = sourceSpecKey != null ? sourceSpecKey.trim().toLowerCase() : "";
        String tgtKey = targetSpecKey != null ? targetSpecKey.trim().toLowerCase() : "";

        if (!SPEC_KEY_PATTERN.matcher(srcKey).matches()) {
            throw new BusinessException(ErrorCode.RULE_INVALID_SPEC_KEY,
                    "source_spec_key '" + srcKey + "' phải tuân theo định dạng snake_case (2-100 ký tự)",
                    List.of(new FieldErrorDTO("source_spec_key", "Sai định dạng snake_case")));
        }
        if (!SPEC_KEY_PATTERN.matcher(tgtKey).matches()) {
            throw new BusinessException(ErrorCode.RULE_INVALID_SPEC_KEY,
                    "target_spec_key '" + tgtKey + "' phải tuân theo định dạng snake_case (2-100 ký tự)",
                    List.of(new FieldErrorDTO("target_spec_key", "Sai định dạng snake_case")));
        }
        if (tgtKey.startsWith("_")) {
            throw new BusinessException(ErrorCode.RULE_INVALID_SPEC_KEY,
                    "target_spec_key phải là thuộc tính tĩnh trên linh kiện đích, không được bắt đầu bằng '_'",
                    List.of(new FieldErrorDTO("target_spec_key", "Không được dùng khóa tổng hợp ở vế đích")));
        }

        if (srcKey.startsWith("_")) {
            Matcher dynMatcher = DYNAMIC_AGG_PATTERN.matcher(srcKey);
            boolean isBuiltin = BUILTIN_AGGREGATE_KEYS.contains(srcKey);
            if (!isBuiltin && !dynMatcher.matches()) {
                throw new BusinessException(ErrorCode.RULE_UNKNOWN_AGGREGATE_KEY,
                        "Khóa tổng hợp không hợp lệ: " + srcKey,
                        List.of(new FieldErrorDTO("source_spec_key", "Chỉ hỗ trợ _count, _sum_capacity_gb, _total_tdp_w, _sum_<field>, _max_<field>")));
            }
            if (!isBuiltin && dynMatcher.matches()) {
                String dynField = dynMatcher.group(2);
                if (!SYSTEM_CATEGORY.equals(srcCat)) {
                    Map<String, FieldDefinition> srcSchema = specSchemaRegistry.getSchemaAsMap(srcCat);
                    FieldDefinition fieldDef = srcSchema.get(dynField);
                    if (fieldDef == null) {
                        throw new BusinessException(ErrorCode.RULE_UNKNOWN_AGGREGATE_KEY,
                                "Trường '" + dynField + "' trong khóa tổng hợp '" + srcKey + "' không tồn tại trong schema danh mục nguồn '" + srcCat + "'",
                                List.of(new FieldErrorDTO("source_spec_key", "Trường '" + dynField + "' không tồn tại trong danh mục " + srcCat)));
                    }
                    if (fieldDef.getType() != FieldType.NUMBER && fieldDef.getType() != FieldType.INTEGER) {
                        throw new BusinessException(ErrorCode.RULE_UNKNOWN_AGGREGATE_KEY,
                                "Trường '" + dynField + "' trong khóa tổng hợp '" + srcKey + "' phải là kiểu số (NUMBER/INTEGER), nhưng có kiểu " + fieldDef.getType(),
                                List.of(new FieldErrorDTO("source_spec_key", "Trường '" + dynField + "' không phải kiểu số")));
                    }
                }
            }
        }

        // 3. Validate Operator & Data Type Compatibility
        if (operator == null) {
            throw new BusinessException(ErrorCode.RULE_INCOMPATIBLE_OPERATOR, "Toán tử so sánh không được để trống");
        }
        if (SYSTEM_CATEGORY.equals(srcCat) && !"_total_tdp_w".equals(srcKey)) {
            throw new BusinessException(ErrorCode.RULE_INCOMPATIBLE_OPERATOR,
                    "Danh mục _SYSTEM chỉ hỗ trợ khóa tổng hợp _total_tdp_w",
                    List.of(new FieldErrorDTO("source_spec_key", "Bắt buộc là _total_tdp_w khi nguồn là _SYSTEM")));
        }
        if (srcKey.startsWith("_") && !NUMERIC_OPERATORS.contains(operator)) {
            throw new BusinessException(ErrorCode.RULE_INCOMPATIBLE_OPERATOR,
                    "Khóa tổng hợp số học (" + srcKey + ") chỉ hỗ trợ các toán tử LTE, GTE, EQUALS, RANGE",
                    List.of(new FieldErrorDTO("operator", "Không thể dùng " + operator + " cho khóa tổng hợp số học")));
        }

        validateRegistryTypeCompatibility(srcCat, tgtCat, srcKey, tgtKey, operator);

        // 4. Validate Error Message Template
        validateTemplate(errorMessageTemplate);

        // 5. Check Duplicate Rule
        if (checkDuplicate) {
            boolean isDuplicate = compatRuleRepository.existsDuplicateRule(
                    srcCat, tgtCat, srcKey, tgtKey, operator, excludeRuleId
            );
            if (isDuplicate) {
                throw new BusinessException(ErrorCode.RULE_DUPLICATE_DEFINITION,
                        "Quy tắc tương thích với cùng cặp danh mục, khóa thông số và toán tử này đã tồn tại");
            }
        }
    }

    private void validateRegistryTypeCompatibility(
            String srcCat, String tgtCat, String srcKey, String tgtKey, RuleOperator operator
    ) {
        Map<String, FieldDefinition> tgtSchema = specSchemaRegistry.getSchemaAsMap(tgtCat);
        FieldDefinition tgtDef = tgtSchema.get(tgtKey);

        if ((operator == RuleOperator.IN || operator == RuleOperator.NOT_IN) && tgtDef != null) {
            if (tgtDef.getType() != FieldType.ARRAY_STRING) {
                throw new BusinessException(ErrorCode.RULE_INCOMPATIBLE_OPERATOR,
                        "Toán tử " + operator + " yêu cầu target_spec_key '" + tgtKey + "' phải có kiểu mảng (ARRAY_STRING)",
                        List.of(new FieldErrorDTO("operator", "Trường đích '" + tgtKey + "' có kiểu " + tgtDef.getType() + ", không phải mảng")));
            }
        }

        if ((operator == RuleOperator.LTE || operator == RuleOperator.GTE) && tgtDef != null) {
            if (tgtDef.getType() != FieldType.NUMBER && tgtDef.getType() != FieldType.INTEGER) {
                throw new BusinessException(ErrorCode.RULE_INCOMPATIBLE_OPERATOR,
                        "Toán tử số học " + operator + " yêu cầu target_spec_key '" + tgtKey + "' phải là kiểu số (NUMBER/INTEGER)",
                        List.of(new FieldErrorDTO("target_spec_key", "Trường đích '" + tgtKey + "' không phải kiểu số")));
            }
        }

        if (!SYSTEM_CATEGORY.equals(srcCat) && !srcKey.startsWith("_")) {
            Map<String, FieldDefinition> srcSchema = specSchemaRegistry.getSchemaAsMap(srcCat);
            FieldDefinition srcDef = srcSchema.get(srcKey);
            if ((operator == RuleOperator.LTE || operator == RuleOperator.GTE || operator == RuleOperator.RANGE) && srcDef != null) {
                if (srcDef.getType() != FieldType.NUMBER && srcDef.getType() != FieldType.INTEGER) {
                    throw new BusinessException(ErrorCode.RULE_INCOMPATIBLE_OPERATOR,
                            "Toán tử số học " + operator + " yêu cầu source_spec_key '" + srcKey + "' phải là kiểu số (NUMBER/INTEGER)",
                            List.of(new FieldErrorDTO("source_spec_key", "Trường nguồn '" + srcKey + "' không phải kiểu số")));
                }
            }
        }
    }

    private void validateTemplate(String template) {
        if (template == null || template.trim().length() < 10 || template.trim().length() > 500) {
            throw new BusinessException(ErrorCode.RULE_INVALID_TEMPLATE_SYNTAX,
                    "Mẫu thông báo lỗi phải có độ dài từ 10 đến 500 ký tự",
                    List.of(new FieldErrorDTO("error_message_template", "Độ dài phải từ 10 đến 500 ký tự")));
        }

        int depth = 0;
        for (int i = 0; i < template.length(); i++) {
            char c = template.charAt(i);
            if (c == '{') {
                depth++;
                if (depth > 1) {
                    throw new BusinessException(ErrorCode.RULE_INVALID_TEMPLATE_SYNTAX,
                            "Mẫu thông báo lỗi có dấu ngoặc nhọn '{' lồng nhau hoặc chưa đóng",
                            List.of(new FieldErrorDTO("error_message_template", "Cú pháp dấu '{' và '}' không hợp lệ")));
                }
            } else if (c == '}') {
                depth--;
                if (depth < 0) {
                    throw new BusinessException(ErrorCode.RULE_INVALID_TEMPLATE_SYNTAX,
                            "Mẫu thông báo lỗi có dấu '}' thừa không khớp",
                            List.of(new FieldErrorDTO("error_message_template", "Cú pháp dấu '{' và '}' không hợp lệ")));
                }
            }
        }
        if (depth != 0) {
            throw new BusinessException(ErrorCode.RULE_INVALID_TEMPLATE_SYNTAX,
                    "Mẫu thông báo lỗi có dấu '{' chưa được đóng bằng '}'",
                    List.of(new FieldErrorDTO("error_message_template", "Thiếu dấu đóng ngoặc '}'")));
        }

        Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);
        List<String> unknownPlaceholders = new ArrayList<>();
        while (matcher.find()) {
            String placeholder = matcher.group(1).trim();
            if (!ALLOWED_PLACEHOLDERS.contains(placeholder)) {
                unknownPlaceholders.add("{" + placeholder + "}");
            }
        }
        if (!unknownPlaceholders.isEmpty()) {
            throw new BusinessException(ErrorCode.RULE_UNKNOWN_PLACEHOLDER,
                    "Biến nội suy không hợp lệ: " + String.join(", ", unknownPlaceholders)
                            + ". Chỉ hỗ trợ: {source_name}, {target_name}, {source_value}, {target_value}, {source_category}, {target_category}",
                    List.of(new FieldErrorDTO("error_message_template", "Chứa biến nội suy không được hỗ trợ")));
        }
    }
}
