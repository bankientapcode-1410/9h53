package com.smartpc.modules.ruleengine;

import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.ruleengine.calculator.AggregateCalculator;
import com.smartpc.modules.ruleengine.dto.request.CreateCompatRuleRequest;
import com.smartpc.modules.ruleengine.dto.request.DryRunRuleRequest;
import com.smartpc.modules.ruleengine.dto.response.CompatRuleDTO;
import com.smartpc.modules.ruleengine.dto.response.DryRunResultDTO;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.evaluator.RuleEvaluator;
import com.smartpc.modules.ruleengine.mapper.CompatRuleMapper;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import com.smartpc.modules.ruleengine.repository.CompatRuleRepository;
import com.smartpc.modules.ruleengine.service.CompatRuleAdminService;
import com.smartpc.modules.ruleengine.service.RuleCacheManager;
import com.smartpc.modules.ruleengine.strategy.EqualsOperatorStrategy;
import com.smartpc.modules.ruleengine.strategy.LteOperatorStrategy;
import com.smartpc.modules.ruleengine.validator.RuleValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompatRuleAdminServiceTest {

    @Mock
    private CompatRuleRepository ruleRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private RuleValidator ruleValidator;

    @Mock
    private RuleCacheManager ruleCacheManager;

    private CompatRuleAdminService adminService;
    private CompatRuleMapper ruleMapper;

    @BeforeEach
    void setUp() {
        CategorySpecSchemaRegistry specSchemaRegistry = new CategorySpecSchemaRegistry();
        AggregateCalculator aggregateCalculator = new AggregateCalculator();
        EqualsOperatorStrategy equalsStrategy = new EqualsOperatorStrategy();
        LteOperatorStrategy lteStrategy = new LteOperatorStrategy();
        RuleEvaluator ruleEvaluator = new RuleEvaluator(List.of(equalsStrategy, lteStrategy));
        ruleMapper = new CompatRuleMapper();

        adminService = new CompatRuleAdminService(
                ruleRepository,
                productRepository,
                categoryRepository,
                specSchemaRegistry,
                ruleValidator,
                ruleCacheManager,
                aggregateCalculator,
                ruleEvaluator,
                ruleMapper
        );
    }

    @Test
    @DisplayName("TC-RE-11: Dry-Run Sandbox phát hiện GPU vượt kích thước Case (isCompatible = false, trích xuất 357.6 vs 320)")
    void testDryRunSandboxEvaluation() {
        CreateCompatRuleRequest ruleDef = CreateCompatRuleRequest.builder()
                .ruleName("GPU Length vs Case")
                .sourceCategory("GPU")
                .targetCategory("CASE")
                .sourceSpecKey("length_mm")
                .targetSpecKey("max_gpu_length_mm")
                .operator(RuleOperator.LTE)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("VGA {source_name} dài {source_value}mm vượt quá chiều dài tối đa của {target_name} ({target_value}mm)")
                .build();

        DryRunRuleRequest request = DryRunRuleRequest.builder()
                .ruleDefinition(ruleDef)
                .testProductIds(List.of("gpu-01", "case-01"))
                .build();

        Category gpuCat = Category.builder().categoryCode("GPU").build();
        Product gpu = Product.builder()
                .productId("gpu-01")
                .name("ASUS ROG Strix RTX 4090")
                .category(gpuCat)
                .specs(Map.of("length_mm", 357.6))
                .build();

        Category caseCat = Category.builder().categoryCode("CASE").build();
        Product pcCase = Product.builder()
                .productId("case-01")
                .name("NZXT H5 Flow")
                .category(caseCat)
                .specs(Map.of("max_gpu_length_mm", 320))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(gpu, pcCase));

        DryRunResultDTO result = adminService.dryRun(request);

        assertNotNull(result);
        assertFalse(result.isCompatible(), "357.6mm > 320mm phải vi phạm quy tắc");
        assertEquals(357.6, result.getExtractedSourceValue());
        assertEquals(320, result.getExtractedTargetValue());
        assertNotNull(result.getRenderedViolationMessage());
        assertTrue(result.getRenderedViolationMessage().contains("357.6"));
        assertTrue(result.getRenderedViolationMessage().contains("320"));
        assertTrue(result.getExecutionTimeMs() >= 0);
    }

    @Test
    @DisplayName("TC-RE-12: Đồng bộ Cache - Mọi thao tác tạo, cập nhật trạng thái, xóa đều gọi ruleCacheManager.evictAll()")
    void testCacheEvictionOnMutations() {
        CompatRule existingRule = CompatRule.builder()
                .ruleId("r-test-01")
                .ruleName("Test Rule")
                .sourceCategory("CPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("socket_type")
                .targetSpecKey("supported_sockets")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Template error")
                .isActive(true)
                .priority(1)
                .build();

        when(ruleRepository.findById("r-test-01")).thenReturn(Optional.of(existingRule));
        when(ruleRepository.save(any(CompatRule.class))).thenAnswer(i -> i.getArgument(0));

        // 1. Toggle status
        CompatRuleDTO toggled = adminService.updateRuleStatus("r-test-01", false);
        assertFalse(toggled.getIsActive());
        verify(ruleCacheManager, times(1)).evictAll();

        // 2. Delete rule
        adminService.deleteRule("r-test-01");
        verify(ruleRepository, times(1)).delete(existingRule);
        verify(ruleCacheManager, times(2)).evictAll();

        // 3. Create rule
        CreateCompatRuleRequest createReq = CreateCompatRuleRequest.builder()
                .ruleName("New Rule")
                .sourceCategory("RAM")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("memory_type")
                .targetSpecKey("supported_memory_types")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Template error")
                .isActive(true)
                .priority(2)
                .build();

        adminService.createRule(createReq);
        verify(ruleCacheManager, times(3)).evictAll();
    }
}
