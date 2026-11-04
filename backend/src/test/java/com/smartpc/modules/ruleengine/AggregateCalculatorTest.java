package com.smartpc.modules.ruleengine;

import com.smartpc.modules.ruleengine.calculator.AggregateCalculator;
import com.smartpc.modules.ruleengine.model.ProductItemContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AggregateCalculatorTest {

    private AggregateCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new AggregateCalculator();
    }

    @Test
    @DisplayName("TC-RE-02: Đếm số khe RAM chiếm dụng với Kit đa thanh (modules_per_kit = 2, quantity = 2 -> 4)")
    void testRamPhysicalSlotCount() {
        ProductItemContext ramKit = ProductItemContext.builder()
                .productId("ram-01")
                .productName("Corsair Vengeance 32GB Kit 2x16GB")
                .categoryCode("RAM")
                .quantity(2)
                .specs(Map.of("modules_per_kit", 2, "capacity_gb", 32))
                .build();

        Map<String, Object> aggregates = calculator.calculateAggregates(List.of(ramKit));

        assertNotNull(aggregates);
        assertEquals(4, aggregates.get("RAM:_count"), "2 bộ kit 2 thanh phải chiếm dụng 4 khe cắm vật lý");
    }

    @Test
    @DisplayName("TC-RE-03: Tính tổng dung lượng RAM (capacity_gb = 64, quantity = 2 -> 128GB)")
    void testRamTotalCapacitySum() {
        ProductItemContext ramKit = ProductItemContext.builder()
                .productId("ram-02")
                .productName("G.Skill Trident Z5 64GB Kit")
                .categoryCode("RAM")
                .quantity(2)
                .specs(Map.of("modules_per_kit", 2, "capacity_gb", 64))
                .build();

        Map<String, Object> aggregates = calculator.calculateAggregates(List.of(ramKit));

        assertNotNull(aggregates);
        assertEquals(128.0, aggregates.get("RAM:_sum_capacity_gb"), "2 bộ kit 64GB phải có tổng dung lượng 128GB");
    }

    @Test
    @DisplayName("TC-RE-04: Tính tổng công suất hệ thống (TotalTDP = 125W CPU + 285W GPU + 50W base = 460W, loại trừ 250W tản nhiệt CPU_COOLER)")
    void testTotalTdpCalculationExcludingCooler() {
        ProductItemContext cpu = ProductItemContext.builder()
                .productId("cpu-01")
                .productName("Intel Core i7-13700K")
                .categoryCode("CPU")
                .quantity(1)
                .specs(Map.of("tdp_w", 125))
                .build();

        ProductItemContext gpu = ProductItemContext.builder()
                .productId("gpu-01")
                .productName("RTX 4070 Ti")
                .categoryCode("GPU")
                .quantity(1)
                .specs(Map.of("tdp_w", 285))
                .build();

        // CPU_COOLER tdp_w is heat dissipation capacity, NOT electrical consumption!
        ProductItemContext cooler = ProductItemContext.builder()
                .productId("cooler-01")
                .productName("Thermalright Peerless Assassin 120 SE")
                .categoryCode("CPU_COOLER")
                .quantity(1)
                .specs(Map.of("tdp_w", 250))
                .build();

        // PSU rated wattage
        ProductItemContext psu = ProductItemContext.builder()
                .productId("psu-01")
                .productName("Corsair RM750e")
                .categoryCode("PSU")
                .quantity(1)
                .specs(Map.of("rated_wattage_w", 750, "tdp_w", 0))
                .build();

        Map<String, Object> aggregates = calculator.calculateAggregates(List.of(cpu, gpu, cooler, psu));

        double expectedTdp = 125.0 + 285.0 + 50.0; // 460.0W (không cộng 250W của Cooler)
        assertEquals(expectedTdp, aggregates.get("_SYSTEM:_total_tdp_w"));
        assertEquals(expectedTdp, aggregates.get("CPU:_total_tdp_w"), "Tương thích luật seed V2 với CPU:_total_tdp_w");
    }

    @Test
    @DisplayName("TC-RE-04b: Tính toán dynamic aggregates _sum_<field> và _max_<field>")
    void testDynamicAggregates() {
        ProductItemContext ssd1 = ProductItemContext.builder()
                .productId("ssd-01")
                .productName("Samsung 980 Pro 1TB")
                .categoryCode("SSD_M2")
                .quantity(2)
                .specs(Map.of("capacity_gb", 1000))
                .build();

        ProductItemContext ssd2 = ProductItemContext.builder()
                .productId("ssd-02")
                .productName("Samsung 990 Pro 2TB")
                .categoryCode("SSD_M2")
                .quantity(1)
                .specs(Map.of("capacity_gb", 2000))
                .build();

        Map<String, Object> aggregates = calculator.calculateAggregates(List.of(ssd1, ssd2));

        // _sum_capacity_gb = 2*1000 + 1*2000 = 4000
        assertEquals(4000.0, aggregates.get("SSD_M2:_sum_capacity_gb"));
        // _max_capacity_gb = 2000
        assertEquals(2000.0, aggregates.get("SSD_M2:_max_capacity_gb"));
    }
}
