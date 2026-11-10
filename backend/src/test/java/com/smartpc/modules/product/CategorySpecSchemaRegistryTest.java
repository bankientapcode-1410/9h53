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

    @Test
    @DisplayName("TC-PROD-24: Đăng ký schema 3 danh mục ngoại vi MONITOR, KEYBOARD, MOUSE")
    void testPeripheralsSchemaRegistered() {
        List<String> peripheralCategories = List.of("MONITOR", "KEYBOARD", "MOUSE");
        for (String cat : peripheralCategories) {
            assertTrue(registry.hasCategory(cat), "Danh mục " + cat + " phải được đăng ký trong Registry");
            List<FieldDefinition> fields = registry.getSchema(cat);
            assertFalse(fields.isEmpty(), "Schema của " + cat + " không được rỗng");
            
            // Check that at least one filterable key exists
            boolean hasFilterable = fields.stream().anyMatch(FieldDefinition::isFilterable);
            assertTrue(hasFilterable, "Danh mục " + cat + " phải có ít nhất 1 thuộc tính lọc được");
        }

        // Verify key fields for MONITOR
        Map<String, FieldDefinition> monitorSchema = registry.getSchemaAsMap("MONITOR");
        assertTrue(monitorSchema.containsKey("screen_size_inch"));
        assertTrue(monitorSchema.containsKey("resolution"));
        assertTrue(monitorSchema.containsKey("refresh_rate_hz"));
        assertTrue(monitorSchema.containsKey("panel_type"));

        // Verify key fields for KEYBOARD
        Map<String, FieldDefinition> keyboardSchema = registry.getSchemaAsMap("KEYBOARD");
        assertTrue(keyboardSchema.containsKey("connection_type"));
        assertTrue(keyboardSchema.containsKey("switch_type"));
        assertTrue(keyboardSchema.containsKey("layout"));
        List<String> layoutValues = keyboardSchema.get("layout").getAllowedValues();
        assertTrue(layoutValues.contains("75%"));
        assertTrue(layoutValues.contains("68%"));
        assertFalse(layoutValues.contains("Compact 75%"));

        // TC-PROD-26: Verify 4 LED types for KEYBOARD
        assertTrue(keyboardSchema.containsKey("led_type"));
        List<String> ledValues = keyboardSchema.get("led_type").getAllowedValues();
        assertTrue(ledValues.contains("RGB"));
        assertTrue(ledValues.contains("Monochrome"));
        assertTrue(ledValues.contains("Rainbow"));
        assertTrue(ledValues.contains("None"));

        // Verify key fields for MOUSE
        Map<String, FieldDefinition> mouseSchema = registry.getSchemaAsMap("MOUSE");
        assertTrue(mouseSchema.containsKey("connection_type"));
        assertTrue(mouseSchema.containsKey("dpi"));
    }
}
