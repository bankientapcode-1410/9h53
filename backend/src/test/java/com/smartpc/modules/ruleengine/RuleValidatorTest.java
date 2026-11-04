package com.smartpc.modules.ruleengine;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.ruleengine.dto.request.CreateCompatRuleRequest;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import com.smartpc.modules.ruleengine.repository.CompatRuleRepository;
import com.smartpc.modules.ruleengine.validator.RuleValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RuleValidatorTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CompatRuleRepository compatRuleRepository;

    private CategorySpecSchemaRegistry specSchemaRegistry;
    private RuleValidator validator;

    @BeforeEach
    void setUp() {
        specSchemaRegistry = new CategorySpecSchemaRegistry();
        validator = new RuleValidator(categoryRepository, specSchemaRegistry, compatRuleRepository);
    }

    @Test
    @DisplayName("TC-RE-06: Chặn tự tham chiếu (source == target) và danh mục không tồn tại")
    void testSelfReferenceAndInvalidCategory() {
        // Self-reference
        CreateCompatRuleRequest selfReq = CreateCompatRuleRequest.builder()
                .ruleName("Self Reference Test")
                .sourceCategory("CPU")
                .targetCategory("CPU")
                .sourceSpecKey("socket_type")
                .targetSpecKey("socket_type")
                .operator(RuleOperator.EQUALS)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Lỗi tự tham chiếu danh mục nguồn và đích {source_name}")
                .build();

        BusinessException ex1 = assertThrows(BusinessException.class, () -> validator.validateForCreate(selfReq));
        assertEquals(ErrorCode.RULE_SELF_REFERENCE.getCode(), ex1.getErrorCode());

        // Unknown target category
        when(categoryRepository.existsByCategoryCode("UNKNOWN")).thenReturn(false);
        when(categoryRepository.existsByCategoryCode("CPU")).thenReturn(true);

        CreateCompatRuleRequest unknownTgtReq = CreateCompatRuleRequest.builder()
                .ruleName("Unknown Category Test")
                .sourceCategory("CPU")
                .targetCategory("UNKNOWN")
                .sourceSpecKey("socket_type")
                .targetSpecKey("socket_type")
                .operator(RuleOperator.EQUALS)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Lỗi danh mục đích không tồn tại trong hệ thống")
                .build();

        BusinessException ex2 = assertThrows(BusinessException.class, () -> validator.validateForCreate(unknownTgtReq));
        assertEquals(ErrorCode.RULE_INVALID_CATEGORY.getCode(), ex2.getErrorCode());
    }

    @Test
    @DisplayName("TC-RE-07: Chặn toán tử không tương thích cho khóa tổng hợp và kiểu dữ liệu Registry")
    void testIncompatibleOperators() {
        when(categoryRepository.existsByCategoryCode("RAM")).thenReturn(true);
        when(categoryRepository.existsByCategoryCode("MOTHERBOARD")).thenReturn(true);

        // 1. Numeric aggregate key _count cannot use IN operator
        CreateCompatRuleRequest aggInReq = CreateCompatRuleRequest.builder()
                .ruleName("Aggregate IN Operator Test")
                .sourceCategory("RAM")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("_count")
                .targetSpecKey("ram_slots")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Không thể dùng toán tử IN cho khóa tổng hợp số học")
                .build();

        BusinessException ex1 = assertThrows(BusinessException.class, () -> validator.validateForCreate(aggInReq));
        assertEquals(ErrorCode.RULE_INCOMPATIBLE_OPERATOR.getCode(), ex1.getErrorCode());

        // 2. target_spec_key with type INTEGER (ram_slots) cannot use IN operator (requires ARRAY_STRING)
        CreateCompatRuleRequest typeMismatchReq = CreateCompatRuleRequest.builder()
                .ruleName("Type Mismatch Test")
                .sourceCategory("RAM")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("capacity_gb")
                .targetSpecKey("ram_slots")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Toán tử IN đòi hỏi trường đích phải là kiểu ARRAY_STRING")
                .build();

        BusinessException ex2 = assertThrows(BusinessException.class, () -> validator.validateForCreate(typeMismatchReq));
        assertEquals(ErrorCode.RULE_INCOMPATIBLE_OPERATOR.getCode(), ex2.getErrorCode());
    }

    @Test
    @DisplayName("TC-RE-08: Bắt lỗi cú pháp Template và placeholder không được hỗ trợ")
    void testTemplateSyntaxAndUnknownPlaceholders() {
        when(categoryRepository.existsByCategoryCode("CPU")).thenReturn(true);
        when(categoryRepository.existsByCategoryCode("MOTHERBOARD")).thenReturn(true);

        // Unclosed curly brace '{'
        CreateCompatRuleRequest unclosedReq = CreateCompatRuleRequest.builder()
                .ruleName("Unclosed Brace Test")
                .sourceCategory("CPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("socket_type")
                .targetSpecKey("supported_sockets")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("CPU {source_name có socket không tương thích")
                .build();

        BusinessException ex1 = assertThrows(BusinessException.class, () -> validator.validateForCreate(unclosedReq));
        assertEquals(ErrorCode.RULE_INVALID_TEMPLATE_SYNTAX.getCode(), ex1.getErrorCode());

        // Unknown placeholder
        CreateCompatRuleRequest unknownPhReq = CreateCompatRuleRequest.builder()
                .ruleName("Unknown Placeholder Test")
                .sourceCategory("CPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("socket_type")
                .targetSpecKey("supported_sockets")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Lỗi biến lạ {unknown_var} và {source_name} không hợp lệ")
                .build();

        BusinessException ex2 = assertThrows(BusinessException.class, () -> validator.validateForCreate(unknownPhReq));
        assertEquals(ErrorCode.RULE_UNKNOWN_PLACEHOLDER.getCode(), ex2.getErrorCode());
    }

    @Test
    @DisplayName("TC-RE-09: Chống tạo trùng lặp quy tắc tương thích (HTTP 409 Conflict)")
    void testDuplicateRuleCheck() {
        when(categoryRepository.existsByCategoryCode("CPU")).thenReturn(true);
        when(categoryRepository.existsByCategoryCode("MOTHERBOARD")).thenReturn(true);

        when(compatRuleRepository.existsDuplicateRule(
                eq("CPU"), eq("MOTHERBOARD"), eq("socket_type"), eq("supported_sockets"),
                eq(RuleOperator.IN), isNull()
        )).thenReturn(true);

        CreateCompatRuleRequest dupReq = CreateCompatRuleRequest.builder()
                .ruleName("Duplicate Rule Test")
                .sourceCategory("CPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("socket_type")
                .targetSpecKey("supported_sockets")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("CPU {source_name} không tương thích với bo mạch chủ")
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () -> validator.validateForCreate(dupReq));
        assertEquals(ErrorCode.RULE_DUPLICATE_DEFINITION.getCode(), ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-RE-VALID: Quy tắc hợp lệ vượt qua kiểm tra 5 bước thành công")
    void testValidRulePasses() {
        when(categoryRepository.existsByCategoryCode("CPU")).thenReturn(true);
        when(categoryRepository.existsByCategoryCode("MOTHERBOARD")).thenReturn(true);
        when(compatRuleRepository.existsDuplicateRule(any(), any(), any(), any(), any(), any()))
                .thenReturn(false);

        CreateCompatRuleRequest validReq = CreateCompatRuleRequest.builder()
                .ruleName("Valid Socket Match Rule")
                .sourceCategory("CPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("socket_type")
                .targetSpecKey("supported_sockets")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("CPU {source_name} socket {source_value} không lắp vừa {target_name} ({target_value})")
                .build();

        assertDoesNotThrow(() -> validator.validateForCreate(validReq));
    }

    @Test
    @DisplayName("TC-RE-23: RuleValidator đối chiếu dynamic aggregate _sum_/_max_<field> với schema nguồn")
    void testDynamicAggregateSchemaValidation() {
        when(categoryRepository.existsByCategoryCode("GPU")).thenReturn(true);
        when(categoryRepository.existsByCategoryCode("CASE")).thenReturn(true);

        // Field 'not_exist_field' does not exist in GPU schema
        CreateCompatRuleRequest nonExistentFieldReq = CreateCompatRuleRequest.builder()
                .ruleName("Dynamic Agg Non-Existent Field")
                .sourceCategory("GPU")
                .targetCategory("CASE")
                .sourceSpecKey("_sum_not_exist_field")
                .targetSpecKey("max_gpu_length_mm")
                .operator(RuleOperator.LTE)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Tổng thông số không tồn tại vượt quá giới hạn thùng máy")
                .build();

        BusinessException ex1 = assertThrows(BusinessException.class, () -> validator.validateForCreate(nonExistentFieldReq));
        assertEquals(ErrorCode.RULE_UNKNOWN_AGGREGATE_KEY.getCode(), ex1.getErrorCode());

        // Field 'bus_interface' exists in GPU schema but has type STRING (not NUMBER/INTEGER)
        CreateCompatRuleRequest nonNumericFieldReq = CreateCompatRuleRequest.builder()
                .ruleName("Dynamic Agg Non-Numeric Field")
                .sourceCategory("GPU")
                .targetCategory("CASE")
                .sourceSpecKey("_sum_bus_interface")
                .targetSpecKey("max_gpu_length_mm")
                .operator(RuleOperator.LTE)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Không thể tổng hợp trường kiểu chuỗi bus_interface")
                .build();

        BusinessException ex2 = assertThrows(BusinessException.class, () -> validator.validateForCreate(nonNumericFieldReq));
        assertEquals(ErrorCode.RULE_UNKNOWN_AGGREGATE_KEY.getCode(), ex2.getErrorCode());
    }
}
