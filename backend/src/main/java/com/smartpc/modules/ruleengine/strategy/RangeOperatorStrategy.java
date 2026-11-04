package com.smartpc.modules.ruleengine.strategy;

import com.smartpc.modules.ruleengine.model.RuleOperator;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
public class RangeOperatorStrategy implements OperatorStrategy {

    @Override
    public RuleOperator getOperator() {
        return RuleOperator.RANGE;
    }

    @Override
    public boolean evaluate(Object sourceValue, Object targetValue) {
        if (sourceValue == null || targetValue == null) {
            return false;
        }

        BigDecimal srcDec = EqualsOperatorStrategy.tryToBigDecimal(sourceValue);
        if (srcDec == null) {
            return false;
        }

        BigDecimal min = null;
        BigDecimal max = null;

        // 1. List / Array: [min, max]
        if (targetValue instanceof List<?> list && list.size() >= 2) {
            min = EqualsOperatorStrategy.tryToBigDecimal(list.get(0));
            max = EqualsOperatorStrategy.tryToBigDecimal(list.get(1));
        } else if (targetValue instanceof Object[] arr && arr.length >= 2) {
            min = EqualsOperatorStrategy.tryToBigDecimal(arr[0]);
            max = EqualsOperatorStrategy.tryToBigDecimal(arr[1]);
        }
        // 2. Map: {"min": ..., "max": ...}
        else if (targetValue instanceof Map<?, ?> map) {
            Object minObj = map.get("min") != null ? map.get("min") : map.get("MIN");
            Object maxObj = map.get("max") != null ? map.get("max") : map.get("MAX");
            min = EqualsOperatorStrategy.tryToBigDecimal(minObj);
            max = EqualsOperatorStrategy.tryToBigDecimal(maxObj);
        }
        // 3. String: "min..max" or "min-max"
        else if (targetValue instanceof String str) {
            String s = str.trim();
            if (s.contains("..")) {
                String[] parts = s.split("\\.\\.");
                if (parts.length >= 2) {
                    min = EqualsOperatorStrategy.tryToBigDecimal(parts[0]);
                    max = EqualsOperatorStrategy.tryToBigDecimal(parts[1]);
                }
            } else if (s.contains("-")) {
                String[] parts = s.split("-");
                if (parts.length >= 2) {
                    min = EqualsOperatorStrategy.tryToBigDecimal(parts[0]);
                    max = EqualsOperatorStrategy.tryToBigDecimal(parts[1]);
                }
            }
        }

        if (min == null || max == null) {
            return false;
        }

        return srcDec.compareTo(min) >= 0 && srcDec.compareTo(max) <= 0;
    }
}
