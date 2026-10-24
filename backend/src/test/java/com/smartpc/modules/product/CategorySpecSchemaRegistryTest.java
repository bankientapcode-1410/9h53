package com.smartpc.modules.product;

import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.schema.FieldDefinition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class CategorySpecSchemaRegistryTest {

    private CategorySpecSchemaRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new CategorySpecSchemaRegistry();
    }

    private record SeedCompatRule(String sourceCategory, String sourceSpecKey,
                                  String targetCategory, String targetSpecKey) {}

    @Test
    @DisplayName("TC-PROD-05: Đồng bộ schema với luật compat_rules trong V2 seed")
    void testCompatibilityRulesSchemaSync() {
        // 10 compat rules seeded in V2__seed_rules.sql
        List<SeedCompatRule> rules = List.of(
                new SeedCompatRule("CPU", "socket_type", "MOTHERBOARD", "supported_sockets"),
                new SeedCompatRule("RAM", "memory_type", "MOTHERBOARD", "supported_memory_types"),
                new SeedCompatRule("RAM", "_count", "MOTHERBOARD", "ram_slots"),
                new SeedCompatRule("RAM", "_sum_capacity_gb", "MOTHERBOARD", "max_ram_gb"),
                new SeedCompatRule("GPU", "length_mm", "CASE", "max_gpu_length_mm"),
                new SeedCompatRule("CPU", "socket_type", "CPU_COOLER", "supported_sockets"),
                new SeedCompatRule("CPU", "_total_tdp_w", "PSU", "rated_wattage_w"),
                new SeedCompatRule("MOTHERBOARD", "form_factor", "CASE", "supported_form_factors"),
                new SeedCompatRule("SSD_M2", "_count", "MOTHERBOARD", "m2_slots"),
                new SeedCompatRule("GPU", "pcie_gen", "MOTHERBOARD", "max_pcie_gen")
        );

        for (SeedCompatRule rule : rules) {
            // Check source category and key
            if (!rule.sourceSpecKey().startsWith("_")) {
                assertTrue(registry.hasCategory(rule.sourceCategory()),
                        "Category " + rule.sourceCategory() + " phải được đăng ký trong Registry");
                Map<String, FieldDefinition> sourceSchema = registry.getSchemaAsMap(rule.sourceCategory());
                assertTrue(sourceSchema.containsKey(rule.sourceSpecKey()),
                        "Key '" + rule.sourceSpecKey() + "' phải có mặt trong schema của " + rule.sourceCategory());
            }

            // Check target category and key
            if (!rule.targetSpecKey().startsWith("_")) {
                assertTrue(registry.hasCategory(rule.targetCategory()),
                        "Category " + rule.targetCategory() + " phải được đăng ký trong Registry");
                Map<String, FieldDefinition> targetSchema = registry.getSchemaAsMap(rule.targetCategory());
                assertTrue(targetSchema.containsKey(rule.targetSpecKey()),
                        "Key '" + rule.targetSpecKey() + "' phải có mặt trong schema của " + rule.targetCategory());
            }
        }
    }
}
