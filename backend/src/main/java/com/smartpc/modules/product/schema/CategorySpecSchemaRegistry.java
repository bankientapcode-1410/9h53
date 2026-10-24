package com.smartpc.modules.product.schema;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CategorySpecSchemaRegistry {

    private final Map<String, List<FieldDefinition>> registry = new HashMap<>();

    public CategorySpecSchemaRegistry() {
        initSchemaRegistry();
    }

    private void initSchemaRegistry() {
        // 1. CPU
        registry.put("CPU", List.of(
                FieldDefinition.builder()
                        .key("socket_type")
                        .label("Socket")
                        .type(FieldType.STRING)
                        .required(true)
                        .filterable(true)
                        .allowedValues(List.of("LGA1700", "AM5"))
                        .build(),
                FieldDefinition.builder()
                        .key("tdp_w")
                        .label("Công suất tiêu thụ (TDP)")
                        .type(FieldType.NUMBER)
                        .required(true)
                        .filterable(false)
                        .unit("W")
                        .minValue(0.0001)
                        .build(),
                FieldDefinition.builder()
                        .key("core_count")
                        .label("Số nhân")
                        .type(FieldType.INTEGER)
                        .required(true)
                        .filterable(true)
                        .unit("nhân")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("thread_count")
                        .label("Số luồng")
                        .type(FieldType.INTEGER)
                        .required(false)
                        .filterable(false)
                        .unit("luồng")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("integrated_graphics")
                        .label("Đồ họa tích hợp")
                        .type(FieldType.BOOLEAN)
                        .required(false)
                        .filterable(true)
                        .build()
        ));

        // 2. MOTHERBOARD
        registry.put("MOTHERBOARD", List.of(
                FieldDefinition.builder()
                        .key("supported_sockets")
                        .label("Socket hỗ trợ")
                        .type(FieldType.ARRAY_STRING)
                        .required(true)
                        .filterable(true)
                        .build(),
                FieldDefinition.builder()
                        .key("form_factor")
                        .label("Kích thước (Form Factor)")
                        .type(FieldType.STRING)
                        .required(true)
                        .filterable(true)
                        .allowedValues(List.of("ATX", "Micro-ATX", "Mini-ITX", "E-ATX"))
                        .build(),
                FieldDefinition.builder()
                        .key("supported_memory_types")
                        .label("Chuẩn RAM hỗ trợ")
                        .type(FieldType.ARRAY_STRING)
                        .required(true)
                        .filterable(false)
                        .build(),
                FieldDefinition.builder()
                        .key("ram_slots")
                        .label("Số khe cắm RAM")
                        .type(FieldType.INTEGER)
                        .required(true)
                        .filterable(false)
                        .unit("khe")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("max_ram_gb")
                        .label("Dung lượng RAM tối đa")
                        .type(FieldType.INTEGER)
                        .required(true)
                        .filterable(false)
                        .unit("GB")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("m2_slots")
                        .label("Số khe cắm M.2")
                        .type(FieldType.INTEGER)
                        .required(true)
                        .filterable(false)
                        .unit("khe")
                        .minValue(0.0)
                        .build(),
                FieldDefinition.builder()
                        .key("max_pcie_gen")
                        .label("Chuẩn PCIe tối đa")
                        .type(FieldType.NUMBER)
                        .required(false)
                        .filterable(false)
                        .allowedValues(List.of("3.0", "4.0", "5.0"))
                        .build(),
                FieldDefinition.builder()
                        .key("chipset")
                        .label("Chipset")
                        .type(FieldType.STRING)
                        .required(false)
                        .filterable(true)
                        .build()
        ));

        // 3. RAM
        registry.put("RAM", List.of(
                FieldDefinition.builder()
                        .key("memory_type")
                        .label("Chuẩn RAM")
                        .type(FieldType.STRING)
                        .required(true)
                        .filterable(true)
                        .allowedValues(List.of("DDR4", "DDR5"))
                        .build(),
                FieldDefinition.builder()
                        .key("capacity_gb")
                        .label("Tổng dung lượng")
                        .type(FieldType.INTEGER)
                        .required(true)
                        .filterable(true)
                        .unit("GB")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("bus_speed_mhz")
                        .label("Tốc độ Bus")
                        .type(FieldType.INTEGER)
                        .required(true)
                        .filterable(false)
                        .unit("MHz")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("modules_per_kit")
                        .label("Số thanh / kit")
                        .type(FieldType.INTEGER)
                        .required(true)
                        .filterable(false)
                        .unit("thanh")
                        .allowedValues(List.of("1", "2", "4"))
                        .build()
        ));

        // 4. GPU
        registry.put("GPU", List.of(
                FieldDefinition.builder()
                        .key("vram_gb")
                        .label("Dung lượng VRAM")
                        .type(FieldType.INTEGER)
                        .required(true)
                        .filterable(true)
                        .unit("GB")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("length_mm")
                        .label("Chiều dài card")
                        .type(FieldType.NUMBER)
                        .required(true)
                        .filterable(false)
                        .unit("mm")
                        .minValue(0.0001)
                        .build(),
                FieldDefinition.builder()
                        .key("tdp_w")
                        .label("Công suất tiêu thụ")
                        .type(FieldType.NUMBER)
                        .required(true)
                        .filterable(false)
                        .unit("W")
                        .minValue(0.0001)
                        .build(),
                FieldDefinition.builder()
                        .key("recommended_psu_w")
                        .label("Công suất nguồn khuyến nghị")
                        .type(FieldType.INTEGER)
                        .required(false)
                        .filterable(false)
                        .unit("W")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("pcie_gen")
                        .label("Chuẩn PCIe")
                        .type(FieldType.NUMBER)
                        .required(false)
                        .filterable(false)
                        .allowedValues(List.of("3.0", "4.0", "5.0"))
                        .build(),
                FieldDefinition.builder()
                        .key("vram_type")
                        .label("Loại bộ nhớ VRAM")
                        .type(FieldType.STRING)
                        .required(false)
                        .filterable(false)
                        .allowedValues(List.of("GDDR6", "GDDR6X"))
                        .build()
        ));

        // 5. SSD_M2
        registry.put("SSD_M2", List.of(
                FieldDefinition.builder()
                        .key("interface_type")
                        .label("Giao tiếp")
                        .type(FieldType.STRING)
                        .required(true)
                        .filterable(true)
                        .allowedValues(List.of("NVMe PCIe 3.0", "NVMe PCIe 4.0", "NVMe PCIe 5.0"))
                        .build(),
                FieldDefinition.builder()
                        .key("capacity_gb")
                        .label("Dung lượng")
                        .type(FieldType.INTEGER)
                        .required(true)
                        .filterable(true)
                        .unit("GB")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("read_speed_mbps")
                        .label("Tốc độ đọc")
                        .type(FieldType.INTEGER)
                        .required(false)
                        .filterable(false)
                        .unit("MB/s")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("tdp_w")
                        .label("Công suất tiêu thụ")
                        .type(FieldType.NUMBER)
                        .required(false)
                        .filterable(false)
                        .unit("W")
                        .minValue(0.0001)
                        .build()
        ));

        // 6. PSU
        registry.put("PSU", List.of(
                FieldDefinition.builder()
                        .key("rated_wattage_w")
                        .label("Công suất định mức")
                        .type(FieldType.INTEGER)
                        .required(true)
                        .filterable(true)
                        .unit("W")
                        .minValue(1.0)
                        .build(),
                FieldDefinition.builder()
                        .key("efficiency_rating")
                        .label("Chuẩn hiệu suất")
                        .type(FieldType.STRING)
                        .required(false)
                        .filterable(true)
                        .build(),
                FieldDefinition.builder()
                        .key("form_factor")
                        .label("Kích thước (Form Factor)")
                        .type(FieldType.STRING)
                        .required(false)
                        .filterable(false)
                        .allowedValues(List.of("ATX", "SFX"))
                        .build()
        ));

        // 7. CASE
        registry.put("CASE", List.of(
                FieldDefinition.builder()
                        .key("supported_form_factors")
                        .label("Hỗ trợ Mainboard")
                        .type(FieldType.ARRAY_STRING)
                        .required(true)
                        .filterable(false)
                        .build(),
                FieldDefinition.builder()
                        .key("max_gpu_length_mm")
                        .label("Chiều dài GPU tối đa")
                        .type(FieldType.NUMBER)
                        .required(true)
                        .filterable(false)
                        .unit("mm")
                        .minValue(0.0001)
                        .build(),
                FieldDefinition.builder()
                        .key("max_cooler_height_mm")
                        .label("Chiều cao tản nhiệt tối đa")
                        .type(FieldType.NUMBER)
                        .required(false)
                        .filterable(false)
                        .unit("mm")
                        .minValue(0.0001)
                        .build()
        ));

        // 8. CPU_COOLER
        registry.put("CPU_COOLER", List.of(
                FieldDefinition.builder()
                        .key("supported_sockets")
                        .label("Socket hỗ trợ")
                        .type(FieldType.ARRAY_STRING)
                        .required(true)
                        .filterable(true)
                        .build(),
                FieldDefinition.builder()
                        .key("cooler_type")
                        .label("Loại tản nhiệt")
                        .type(FieldType.STRING)
                        .required(true)
                        .filterable(true)
                        .allowedValues(List.of("AIR", "AIO_240", "AIO_280", "AIO_360"))
                        .build(),
                FieldDefinition.builder()
                        .key("height_mm")
                        .label("Chiều cao tản nhiệt")
                        .type(FieldType.NUMBER)
                        .required(false)
                        .filterable(false)
                        .unit("mm")
                        .minValue(0.0001)
                        .build(),
                FieldDefinition.builder()
                        .key("tdp_w")
                        .label("Công suất giải nhiệt")
                        .type(FieldType.NUMBER)
                        .required(false)
                        .filterable(false)
                        .unit("W")
                        .minValue(0.0001)
                        .build()
        ));
    }

    public List<FieldDefinition> getSchema(String categoryCode) {
        if (categoryCode == null) {
            return Collections.emptyList();
        }
        return registry.getOrDefault(categoryCode.trim().toUpperCase(), Collections.emptyList());
    }

    public boolean hasCategory(String categoryCode) {
        if (categoryCode == null) {
            return false;
        }
        return registry.containsKey(categoryCode.trim().toUpperCase());
    }

    public Set<String> getFilterableKeys(String categoryCode) {
        List<FieldDefinition> definitions = getSchema(categoryCode);
        Set<String> filterableKeys = new LinkedHashSet<>();
        for (FieldDefinition def : definitions) {
            if (def.isFilterable()) {
                filterableKeys.add(def.getKey());
            }
        }
        return filterableKeys;
    }

    public Map<String, FieldDefinition> getSchemaAsMap(String categoryCode) {
        List<FieldDefinition> definitions = getSchema(categoryCode);
        Map<String, FieldDefinition> map = new LinkedHashMap<>();
        for (FieldDefinition def : definitions) {
            map.put(def.getKey(), def);
        }
        return map;
    }
}
