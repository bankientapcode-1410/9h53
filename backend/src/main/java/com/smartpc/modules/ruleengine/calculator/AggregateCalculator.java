package com.smartpc.modules.ruleengine.calculator;

import com.smartpc.modules.ruleengine.model.ProductItemContext;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Component
public class AggregateCalculator {

    public static final double BASE_SYSTEM_OVERHEAD_W = 50.0;
    public static final String SYSTEM_CATEGORY = "_SYSTEM";
    public static final String TOTAL_TDP_KEY = "_total_tdp_w";
    public static final String COUNT_KEY = "_count";
    public static final String SUM_CAPACITY_GB_KEY = "_sum_capacity_gb";

    private static final Set<String> EXCLUDED_TDP_CATEGORIES = Set.of("PSU", "CPU_COOLER");

    public Map<String, Object> calculateAggregates(List<ProductItemContext> items) {
        Map<String, Object> aggregates = new LinkedHashMap<>();
        if (items == null || items.isEmpty()) {
            aggregates.put(SYSTEM_CATEGORY + ":" + TOTAL_TDP_KEY, BASE_SYSTEM_OVERHEAD_W);
            aggregates.put("CPU:" + TOTAL_TDP_KEY, BASE_SYSTEM_OVERHEAD_W);
            return aggregates;
        }

        double totalTdpW = 0.0;
        Map<String, Integer> countsByCategory = new HashMap<>();
        Map<String, Double> capacityByCategory = new HashMap<>();
        Map<String, Double> dynamicSums = new HashMap<>();
        Map<String, Double> dynamicMaxs = new HashMap<>();

        for (ProductItemContext item : items) {
            if (item == null) continue;
            String cat = item.getCategoryCode() != null ? item.getCategoryCode().trim().toUpperCase() : "UNKNOWN";
            int quantity = Math.max(1, item.getQuantity());
            Map<String, Object> specs = item.getSpecs() != null ? item.getSpecs() : Collections.emptyMap();

            // 1. Physical slots count: quantity * max(1, modules_per_kit)
            int modulesPerKit = toInt(specs.get("modules_per_kit"), 1);
            int effectiveModules = quantity * Math.max(1, modulesPerKit);
            countsByCategory.put(cat, countsByCategory.getOrDefault(cat, 0) + effectiveModules);

            // 2. Memory capacity sum: quantity * capacity_gb
            double capGb = toDouble(specs.get("capacity_gb"), 0.0);
            if (capGb > 0.0) {
                capacityByCategory.put(cat, capacityByCategory.getOrDefault(cat, 0.0) + (quantity * capGb));
            }

            // 3. Power TDP calculation (exclude PSU & CPU_COOLER)
            if (!EXCLUDED_TDP_CATEGORIES.contains(cat)) {
                double tdp = toDouble(specs.get("tdp_w"), 0.0);
                totalTdpW += (quantity * tdp);
            }

            // 4. Dynamic aggregates: _sum_<field> and _max_<field> for all numeric specs
            for (Map.Entry<String, Object> entry : specs.entrySet()) {
                String field = entry.getKey();
                if (field == null || field.startsWith("_")) continue;
                Double numVal = tryExtractNumber(entry.getValue());
                if (numVal != null) {
                    String sumKey = cat + ":_sum_" + field.toLowerCase();
                    String maxKey = cat + ":_max_" + field.toLowerCase();

                    dynamicSums.put(sumKey, dynamicSums.getOrDefault(sumKey, 0.0) + (quantity * numVal));
                    double currentMax = dynamicMaxs.getOrDefault(maxKey, Double.NEGATIVE_INFINITY);
                    if (numVal > currentMax) {
                        dynamicMaxs.put(maxKey, numVal);
                    }
                }
            }
        }

        // Add base overhead
        double finalTotalTdp = totalTdpW + BASE_SYSTEM_OVERHEAD_W;
        aggregates.put(SYSTEM_CATEGORY + ":" + TOTAL_TDP_KEY, finalTotalTdp);
        aggregates.put("CPU:" + TOTAL_TDP_KEY, finalTotalTdp); // Compatibility with V2 seed rules

        countsByCategory.forEach((cat, cnt) -> aggregates.put(cat + ":" + COUNT_KEY, cnt));
        capacityByCategory.forEach((cat, cap) -> aggregates.put(cat + ":" + SUM_CAPACITY_GB_KEY, cap));
        dynamicSums.forEach(aggregates::put);
        dynamicMaxs.forEach(aggregates::put);

        return aggregates;
    }

    private int toInt(Object value, int defaultVal) {
        if (value == null) return defaultVal;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(value.toString().trim());
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private double toDouble(Object value, double defaultVal) {
        if (value == null) return defaultVal;
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(value.toString().trim());
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private Double tryExtractNumber(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(value.toString().trim());
        } catch (Exception e) {
            return null;
        }
    }
}
