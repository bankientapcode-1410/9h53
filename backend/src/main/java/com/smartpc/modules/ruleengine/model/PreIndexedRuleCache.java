package com.smartpc.modules.ruleengine.model;

import com.smartpc.modules.ruleengine.entity.CompatRule;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class PreIndexedRuleCache {

    // Key: "SOURCE_CATEGORY:TARGET_CATEGORY" (VD: "CPU:MOTHERBOARD", "_SYSTEM:PSU")
    // Value: Danh sách CompatRule bất biến đã sắp xếp theo priority ASC
    private final Map<String, List<CompatRule>> rulesByPair;
    private final List<CompatRule> allActiveRules;

    public PreIndexedRuleCache(Map<String, List<CompatRule>> rulesByPair, List<CompatRule> allActiveRules) {
        Map<String, List<CompatRule>> copy = new LinkedHashMap<>();
        if (rulesByPair != null) {
            rulesByPair.forEach((k, v) -> copy.put(k, List.copyOf(v)));
        }
        this.rulesByPair = Collections.unmodifiableMap(copy);
        this.allActiveRules = allActiveRules != null ? List.copyOf(allActiveRules) : Collections.emptyList();
    }

    public List<CompatRule> getRulesForPair(String sourceCategory, String targetCategory) {
        return rulesByPair.getOrDefault(sourceCategory + ":" + targetCategory, Collections.emptyList());
    }

    public Map<String, List<CompatRule>> getAllPairs() {
        return rulesByPair;
    }

    public List<CompatRule> getAllActiveRules() {
        return allActiveRules;
    }
}
