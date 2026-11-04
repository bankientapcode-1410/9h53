package com.smartpc.modules.ruleengine;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.ruleengine.calculator.AggregateCalculator;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.evaluator.RuleEvaluator;
import com.smartpc.modules.ruleengine.model.PreIndexedRuleCache;
import com.smartpc.modules.ruleengine.model.ProductItemContext;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import com.smartpc.modules.ruleengine.service.CompatibilityService;
import com.smartpc.modules.ruleengine.service.RuleCacheManager;
import com.smartpc.modules.ruleengine.strategy.EqualsOperatorStrategy;
import com.smartpc.modules.ruleengine.strategy.InOperatorStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ForkJoinPool;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompatibilityServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RuleCacheManager ruleCacheManager;

    private CompatibilityService compatibilityService;

    @BeforeEach
    void setUp() {
        AggregateCalculator aggregateCalculator = new AggregateCalculator();
        EqualsOperatorStrategy equalsStrategy = new EqualsOperatorStrategy();
        InOperatorStrategy inStrategy = new InOperatorStrategy(equalsStrategy);
        RuleEvaluator ruleEvaluator = new RuleEvaluator(List.of(equalsStrategy, inStrategy));

        compatibilityService = new CompatibilityService(
                productRepository,
                ruleCacheManager,
                aggregateCalculator,
                ruleEvaluator,
                ForkJoinPool.commonPool()
        );
    }

    @Test
    @DisplayName("TC-RE-01: Kiểm tra xung đột Socket CPU LGA1700 và Mainboard AM5 (Báo 1 ERROR)")
    void testSocketMismatchViolation() {
        // Prepare Rules
        CompatRule socketRule = CompatRule.builder()
                .ruleId("r-socket-01")
                .ruleName("CPU-Motherboard Socket Match")
                .sourceCategory("CPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("socket_type")
                .targetSpecKey("supported_sockets")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("CPU {source_name} (socket {source_value}) không tương thích với {target_name} (hỗ trợ: {target_value})")
                .isActive(true)
                .priority(1)
                .build();

        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("CPU:MOTHERBOARD", List.of(socketRule)),
                List.of(socketRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        // Prepare Mock Products
        Category cpuCat = Category.builder().categoryCode("CPU").build();
        Product cpu = Product.builder()
                .productId("p-cpu-01")
                .name("Intel Core i7-13700K")
                .category(cpuCat)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 125))
                .build();

        Category mbCat = Category.builder().categoryCode("MOTHERBOARD").build();
        Product mb = Product.builder()
                .productId("p-mb-01")
                .name("ASUS ROG Crosshair X670E Hero")
                .category(mbCat)
                .specs(Map.of("supported_sockets", List.of("AM5")))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu, mb));

        CompatibilityResult result = compatibilityService.checkCompatibility(
                List.of("p-cpu-01", "p-mb-01")
        );

        assertNotNull(result);
        assertFalse(result.isCompatible(), "Cấu hình lệch socket phải báo không tương thích (is_compatible = false)");
        assertEquals(1, result.getErrors().size(), "Phải có đúng 1 lỗi ERROR");

        CompatibilityResult.ViolationDetail error = result.getErrors().get(0);
        assertEquals("CPU-Motherboard Socket Match", error.getRuleName());
        assertEquals(RuleSeverity.ERROR, error.getSeverity());
        assertTrue(error.getMessage().contains("LGA1700"));
        assertTrue(error.getMessage().contains("AM5"));
        assertEquals("p-cpu-01", error.getSourceProduct().getId());
        assertEquals("p-mb-01", error.getTargetProduct().getId());
    }

    @Test
    @DisplayName("TC-RE-10: Null-Safety - Sản phẩm thiếu trường thông số trong specs không được ném NPE")
    void testNullSafetyWhenSpecsMissing() {
        CompatRule pcieRule = CompatRule.builder()
                .ruleId("r-pcie-01")
                .ruleName("PCIe Generation Check")
                .sourceCategory("GPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("pcie_gen")
                .targetSpecKey("max_pcie_gen")
                .operator(RuleOperator.EQUALS)
                .severity(RuleSeverity.WARNING)
                .errorMessageTemplate("Phiên bản PCIe không khớp")
                .isActive(true)
                .priority(1)
                .build();

        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("GPU:MOTHERBOARD", List.of(pcieRule)),
                List.of(pcieRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        // GPU lacks pcie_gen field in specs
        Category gpuCat = Category.builder().categoryCode("GPU").build();
        Product gpuWithoutPcie = Product.builder()
                .productId("p-gpu-01")
                .name("Old GPU")
                .category(gpuCat)
                .specs(Map.of("length_mm", 240)) // missing pcie_gen
                .build();

        Category mbCat = Category.builder().categoryCode("MOTHERBOARD").build();
        Product mb = Product.builder()
                .productId("p-mb-02")
                .name("B760M Mainboard")
                .category(mbCat)
                .specs(Map.of("max_pcie_gen", 4.0))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(gpuWithoutPcie, mb));

        // Must not throw NullPointerException
        CompatibilityResult result = assertDoesNotThrow(
                () -> compatibilityService.checkCompatibility(List.of("p-gpu-01", "p-mb-02"))
        );

        assertNotNull(result);
        assertTrue(result.isCompatible(), "Thiếu spec tùy chọn phải an toàn bỏ qua và không chặn build");
        assertTrue(result.getErrors().isEmpty());
        assertEquals(1, result.getWarnings().size(), "Phải sinh 1 cảnh báo WARNING không thể xác minh khi thiếu thông số");
        assertTrue(result.getWarnings().get(0).getMessage().contains("Không thể xác minh"));
    }

    @Test
    @DisplayName("TC-RE-14: Chặn request có hơn 30 sản phẩm phân biệt (RULE_CHECK_TOO_MANY_PRODUCTS)")
    void testTooManyProductsViolation() {
        Map<String, Integer> productQuantities = new LinkedHashMap<>();
        for (int i = 1; i <= 31; i++) {
            productQuantities.put("prod-" + i, 1);
        }

        BusinessException ex = assertThrows(BusinessException.class,
                () -> compatibilityService.checkCompatibilityWithQuantities(productQuantities));

        assertEquals(ErrorCode.RULE_CHECK_TOO_MANY_PRODUCTS.getCode(), ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-RE-15: Chặn quantity của một sản phẩm vượt quá 16 (RULE_CHECK_QUANTITY_EXCEEDED)")
    void testQuantityExceededViolation() {
        Map<String, Integer> productQuantities = Map.of("prod-01", 17);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> compatibilityService.checkCompatibilityWithQuantities(productQuantities));

        assertEquals(ErrorCode.RULE_CHECK_QUANTITY_EXCEEDED.getCode(), ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-RE-16: Trả về unresolved_product_ids khi sản phẩm không tìm thấy hoặc inactive")
    void testUnresolvedProductIds() {
        // Prepare Rules
        PreIndexedRuleCache cache = new PreIndexedRuleCache(Map.of(), List.of());
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        // Requested: p1 and p-missing
        Category cpuCat = Category.builder().categoryCode("CPU").build();
        Product cpu = Product.builder()
                .productId("p1")
                .name("CPU 1")
                .category(cpuCat)
                .specs(Map.of())
                .build();

        // Repository only returns p1 (p-missing is inactive or not found)
        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu));

        CompatibilityResult result = compatibilityService.checkCompatibilityWithQuantities(
                Map.of("p1", 1, "p-missing", 1)
        );

        assertNotNull(result);
        assertTrue(result.isCompatible());
        assertEquals(1, result.getUnresolvedProductIds().size());
        assertEquals("p-missing", result.getUnresolvedProductIds().get(0));
    }

    @Test
    @DisplayName("TC-RE-20: categoryCode = null không gây NullPointerException")
    void testNullCategoryCodeSafety() {
        PreIndexedRuleCache cache = new PreIndexedRuleCache(Map.of(), List.of());
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        Category nullCat = Category.builder().categoryCode(null).build();
        Product weirdProduct = Product.builder()
                .productId("p-weird")
                .name("Weird Item")
                .category(nullCat)
                .specs(Map.of())
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(weirdProduct));

        CompatibilityResult result = assertDoesNotThrow(
                () -> compatibilityService.checkCompatibility(List.of("p-weird"))
        );

        assertNotNull(result);
        assertTrue(result.isCompatible());
    }
}
