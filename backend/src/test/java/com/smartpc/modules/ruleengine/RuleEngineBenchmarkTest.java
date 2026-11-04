package com.smartpc.modules.ruleengine;

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
import com.smartpc.modules.ruleengine.strategy.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;
import java.util.concurrent.ForkJoinPool;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RuleEngineBenchmarkTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RuleCacheManager ruleCacheManager;

    private CompatibilityService compatibilityService;
    private List<ProductItemContext> fullPcConfiguration;

    @BeforeEach
    void setUp() {
        AggregateCalculator aggregateCalculator = new AggregateCalculator();
        EqualsOperatorStrategy equalsStrategy = new EqualsOperatorStrategy();
        InOperatorStrategy inStrategy = new InOperatorStrategy(equalsStrategy);
        NotInOperatorStrategy notInStrategy = new NotInOperatorStrategy(inStrategy);
        LteOperatorStrategy lteStrategy = new LteOperatorStrategy();
        GteOperatorStrategy gteStrategy = new GteOperatorStrategy();
        RangeOperatorStrategy rangeStrategy = new RangeOperatorStrategy();

        RuleEvaluator ruleEvaluator = new RuleEvaluator(List.of(
                equalsStrategy, inStrategy, notInStrategy, lteStrategy, gteStrategy, rangeStrategy
        ));

        compatibilityService = new CompatibilityService(
                productRepository,
                ruleCacheManager,
                aggregateCalculator,
                ruleEvaluator,
                ForkJoinPool.commonPool()
        );

        // Build 50 active rules covering all pairs
        List<CompatRule> rules = new ArrayList<>();
        Map<String, List<CompatRule>> rulesByPair = new LinkedHashMap<>();

        String[] categories = {"CPU", "MOTHERBOARD", "RAM", "GPU", "SSD_M2", "PSU", "CASE", "CPU_COOLER"};

        int ruleCount = 0;
        for (int i = 0; i < categories.length; i++) {
            for (int j = 0; j < categories.length; j++) {
                if (i != j && ruleCount < 45) {
                    ruleCount++;
                    String src = categories[i];
                    String tgt = categories[j];
                    CompatRule r = CompatRule.builder()
                            .ruleId("r-bench-" + ruleCount)
                            .ruleName("Rule " + src + " -> " + tgt)
                            .sourceCategory(src)
                            .targetCategory(tgt)
                            .sourceSpecKey("test_key")
                            .targetSpecKey("test_target_key")
                            .operator(RuleOperator.EQUALS)
                            .severity(RuleSeverity.WARNING)
                            .errorMessageTemplate("{source_name} warning with {target_name}")
                            .isActive(true)
                            .priority(ruleCount)
                            .build();

                    rules.add(r);
                    rulesByPair.computeIfAbsent(src + ":" + tgt, k -> new ArrayList<>()).add(r);
                }
            }
        }

        // Add 5 aggregate rules
        for (int k = 1; k <= 5; k++) {
            CompatRule sysRule = CompatRule.builder()
                    .ruleId("r-bench-sys-" + k)
                    .ruleName("System TDP rule " + k)
                    .sourceCategory("_SYSTEM")
                    .targetCategory("PSU")
                    .sourceSpecKey("_total_tdp_w")
                    .targetSpecKey("rated_wattage_w")
                    .operator(RuleOperator.LTE)
                    .severity(RuleSeverity.WARNING)
                    .errorMessageTemplate("System total TDP exceeds PSU")
                    .isActive(true)
                    .priority(k)
                    .build();
            rules.add(sysRule);
            rulesByPair.computeIfAbsent("_SYSTEM:PSU", pairKey -> new ArrayList<>()).add(sysRule);
        }

        PreIndexedRuleCache cache = new PreIndexedRuleCache(rulesByPair, rules);
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        // Build full 8-component PC
        fullPcConfiguration = List.of(
                ProductItemContext.builder().productId("p1").productName("CPU Intel").categoryCode("CPU").quantity(1)
                        .specs(Map.of("socket_type", "LGA1700", "tdp_w", 125, "test_key", "match", "test_target_key", "match")).build(),
                ProductItemContext.builder().productId("p2").productName("Mainboard ASUS").categoryCode("MOTHERBOARD").quantity(1)
                        .specs(Map.of("supported_sockets", List.of("LGA1700"), "ram_slots", 4, "test_key", "match", "test_target_key", "match")).build(),
                ProductItemContext.builder().productId("p3").productName("RAM Corsair").categoryCode("RAM").quantity(2)
                        .specs(Map.of("modules_per_kit", 2, "capacity_gb", 32, "test_key", "match", "test_target_key", "match")).build(),
                ProductItemContext.builder().productId("p4").productName("GPU RTX 4080").categoryCode("GPU").quantity(1)
                        .specs(Map.of("length_mm", 304, "tdp_w", 320, "test_key", "match", "test_target_key", "match")).build(),
                ProductItemContext.builder().productId("p5").productName("SSD Samsung").categoryCode("SSD_M2").quantity(2)
                        .specs(Map.of("form_factor", "2280", "capacity_gb", 1000, "test_key", "match", "test_target_key", "match")).build(),
                ProductItemContext.builder().productId("p6").productName("PSU Corsair 850W").categoryCode("PSU").quantity(1)
                        .specs(Map.of("rated_wattage_w", 850, "test_key", "match", "test_target_key", "match")).build(),
                ProductItemContext.builder().productId("p7").productName("Case NZXT").categoryCode("CASE").quantity(1)
                        .specs(Map.of("max_gpu_length_mm", 360, "max_cooler_height_mm", 165, "test_key", "match", "test_target_key", "match")).build(),
                ProductItemContext.builder().productId("p8").productName("Cooler Noctua").categoryCode("CPU_COOLER").quantity(1)
                        .specs(Map.of("height_mm", 160, "tdp_w", 250, "test_key", "match", "test_target_key", "match")).build()
        );
    }

    @Test
    @DisplayName("TC-RE-13: Benchmark hiệu năng đánh giá cấu hình 8 linh kiện với 50 rules (P99 Latency < 2.0ms)")
    void testPerformanceP99LatencyUnder2ms() {
        // 1. Warm-up JIT compiler (2000 iterations to ensure full C2 optimization)
        for (int i = 0; i < 2000; i++) {
            compatibilityService.evaluateContexts(fullPcConfiguration);
        }
        System.gc();
        try {
            Thread.sleep(100);
        } catch (InterruptedException ignored) {}

        // 2. Benchmark 1,000 iterations
        int iterations = 1000;
        long[] elapsedNanos = new long[iterations];

        for (int i = 0; i < iterations; i++) {
            long start = System.nanoTime();
            CompatibilityResult res = compatibilityService.evaluateContexts(fullPcConfiguration);
            elapsedNanos[i] = System.nanoTime() - start;
            assertNotNull(res);
        }

        Arrays.sort(elapsedNanos);

        // P99 latency: index 990
        double p99Millis = elapsedNanos[(int) (iterations * 0.99)] / 1_000_000.0;
        double p50Millis = elapsedNanos[(int) (iterations * 0.50)] / 1_000_000.0;
        double avgMillis = Arrays.stream(elapsedNanos).average().orElse(0) / 1_000_000.0;

        System.out.printf("Benchmark Result [8 Components, 50 Rules, %d Runs]:%n", iterations);
        System.out.printf("  Average Latency: %.3f ms%n", avgMillis);
        System.out.printf("  P50 Latency:     %.3f ms%n", p50Millis);
        System.out.printf("  P99 Latency:     %.3f ms%n", p99Millis);

        // Verification: P99 latency must be under 2.0ms according to DD §1.1 and TC-RE-13
        assertTrue(p99Millis < 2.0, "P99 latency phải dưới 2.0ms, thực tế: " + p99Millis + "ms");
    }
}
