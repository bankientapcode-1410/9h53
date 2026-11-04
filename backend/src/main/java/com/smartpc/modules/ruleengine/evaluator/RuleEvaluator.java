package com.smartpc.modules.ruleengine.evaluator;

import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ProductReference;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ViolationDetail;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.model.ProductItemContext;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.strategy.OperatorStrategy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Component
public class RuleEvaluator {

    public static final String SYSTEM_CATEGORY = "_SYSTEM";
    public static final String TOTAL_TDP_KEY = "_total_tdp_w";

    private final Map<RuleOperator, OperatorStrategy> strategyMap = new EnumMap<>(RuleOperator.class);

    public RuleEvaluator(List<OperatorStrategy> strategies) {
        if (strategies != null) {
            for (OperatorStrategy strategy : strategies) {
                strategyMap.put(strategy.getOperator(), strategy);
            }
        }
    }

    public List<ViolationDetail> evaluateRule(
            CompatRule rule,
            List<ProductItemContext> sources,
            List<ProductItemContext> targets,
            Map<String, Object> aggregates
    ) {
        List<ViolationDetail> violations = new ArrayList<>();
        if (rule == null || targets == null || targets.isEmpty()) {
            return violations;
        }

        OperatorStrategy strategy = strategyMap.get(rule.getOperator());
        if (strategy == null) {
            log.error("No OperatorStrategy found for operator: {}", rule.getOperator());
            return violations;
        }

        boolean isAggregate = rule.getSourceSpecKey() != null && rule.getSourceSpecKey().startsWith("_")
                || SYSTEM_CATEGORY.equalsIgnoreCase(rule.getSourceCategory());

        if (isAggregate) {
            // Aggregate Rule: evaluate once per target item
            Object sourceValue = extractAggregateSourceValue(rule, aggregates);
            if (sourceValue == null) {
                log.warn("Missing aggregate value for key [{}:{}] when evaluating rule [{}]",
                        rule.getSourceCategory(), rule.getSourceSpecKey(), rule.getRuleName());
                return violations;
            }

            ProductItemContext representativeSource = (sources != null && !sources.isEmpty()) ? sources.get(0) : null;

            for (ProductItemContext targetItem : targets) {
                if (targetItem == null) continue;
                Object targetValue = targetItem.getSpecs() != null ? targetItem.getSpecs().get(rule.getTargetSpecKey()) : null;
                if (targetValue == null) {
                    log.warn("Missing target spec key [{}] on product [{}] when evaluating rule [{}]",
                            rule.getTargetSpecKey(), targetItem.getProductId(), rule.getRuleName());
                    continue;
                }

                boolean satisfied = strategy.evaluate(sourceValue, targetValue);
                if (!satisfied) {
                    ProductReference srcRef = isSystemOrTdp(rule) ? null : toProductReference(representativeSource);
                    ProductReference tgtRef = toProductReference(targetItem);
                    String message = interpolateMessage(rule.getErrorMessageTemplate(), sourceValue, targetValue,
                            isSystemOrTdp(rule) ? null : representativeSource, targetItem, rule);

                    violations.add(ViolationDetail.builder()
                            .ruleId(rule.getRuleId())
                            .ruleName(rule.getRuleName())
                            .severity(rule.getSeverity())
                            .message(message)
                            .sourceProduct(srcRef)
                            .targetProduct(tgtRef)
                            .build());
                }
            }
        } else {
            // Item-level Rule: evaluate for each (source, target) pair
            if (sources == null || sources.isEmpty()) {
                return violations;
            }

            for (ProductItemContext sourceItem : sources) {
                if (sourceItem == null) continue;
                Object sourceValue = sourceItem.getSpecs() != null ? sourceItem.getSpecs().get(rule.getSourceSpecKey()) : null;
                if (sourceValue == null) {
                    log.warn("Missing source spec key [{}] on product [{}] when evaluating rule [{}]",
                            rule.getSourceSpecKey(), sourceItem.getProductId(), rule.getRuleName());
                    continue;
                }

                for (ProductItemContext targetItem : targets) {
                    if (targetItem == null) continue;
                    Object targetValue = targetItem.getSpecs() != null ? targetItem.getSpecs().get(rule.getTargetSpecKey()) : null;
                    if (targetValue == null) {
                        log.warn("Missing target spec key [{}] on product [{}] when evaluating rule [{}]",
                                rule.getTargetSpecKey(), targetItem.getProductId(), rule.getRuleName());
                        continue;
                    }

                    boolean satisfied = strategy.evaluate(sourceValue, targetValue);
                    if (!satisfied) {
                        String message = interpolateMessage(rule.getErrorMessageTemplate(), sourceValue, targetValue,
                                sourceItem, targetItem, rule);

                        violations.add(ViolationDetail.builder()
                                .ruleId(rule.getRuleId())
                                .ruleName(rule.getRuleName())
                                .severity(rule.getSeverity())
                                .message(message)
                                .sourceProduct(toProductReference(sourceItem))
                                .targetProduct(toProductReference(targetItem))
                                .build());
                    }
                }
            }
        }

        return violations;
    }

    public Object extractAggregateSourceValue(CompatRule rule, Map<String, Object> aggregates) {
        if (aggregates == null) return null;
        String srcKey = rule.getSourceSpecKey() != null ? rule.getSourceSpecKey().toLowerCase() : "";
        if (TOTAL_TDP_KEY.equals(srcKey) || SYSTEM_CATEGORY.equalsIgnoreCase(rule.getSourceCategory())) {
            Object val = aggregates.get(SYSTEM_CATEGORY + ":" + TOTAL_TDP_KEY);
            if (val == null) {
                val = aggregates.get("CPU:" + TOTAL_TDP_KEY);
            }
            return val;
        }
        String cat = rule.getSourceCategory() != null ? rule.getSourceCategory().toUpperCase() : "";
        return aggregates.get(cat + ":" + srcKey);
    }

    public String interpolateMessage(
            String template,
            Object sourceValue,
            Object targetValue,
            ProductItemContext sourceItem,
            ProductItemContext targetItem,
            CompatRule rule
    ) {
        if (template == null) return "";

        String srcName = sourceItem != null ? sourceItem.getProductName() : "Toàn hệ thống";
        String tgtName = targetItem != null ? targetItem.getProductName() : "";
        String srcValStr = formatValue(sourceValue);
        String tgtValStr = formatValue(targetValue);
        String srcCat = rule.getSourceCategory() != null ? rule.getSourceCategory() : "";
        String tgtCat = rule.getTargetCategory() != null ? rule.getTargetCategory() : "";

        return template
                .replace("{source_name}", srcName)
                .replace("{target_name}", tgtName)
                .replace("{source_value}", srcValStr)
                .replace("{target_value}", tgtValStr)
                .replace("{source_category}", srcCat)
                .replace("{target_category}", tgtCat);
    }

    public String formatValue(Object val) {
        if (val == null) return "";
        if (val instanceof Collection<?> col) {
            List<String> formatted = new ArrayList<>();
            for (Object elem : col) {
                if (elem != null) {
                    formatted.add(formatValue(elem));
                }
            }
            return String.join(", ", formatted);
        }
        if (val instanceof Number n) {
            double d = n.doubleValue();
            if (d == Math.floor(d) && !Double.isInfinite(d)) {
                return String.valueOf(n.longValue());
            }
            return String.valueOf(d);
        }
        return val.toString().trim();
    }

    private boolean isSystemOrTdp(CompatRule rule) {
        return SYSTEM_CATEGORY.equalsIgnoreCase(rule.getSourceCategory())
                || TOTAL_TDP_KEY.equalsIgnoreCase(rule.getSourceSpecKey());
    }

    private ProductReference toProductReference(ProductItemContext item) {
        if (item == null) return null;
        return ProductReference.builder()
                .id(item.getProductId())
                .name(item.getProductName())
                .categoryCode(item.getCategoryCode())
                .build();
    }
}
