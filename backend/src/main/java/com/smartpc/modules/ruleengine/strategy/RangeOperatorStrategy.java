package com.smartpc.modules.ruleengine.strategy;

import com.smartpc.modules.ruleengine.model.RuleOperator;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RangeOperatorStrategy implements OperatorStrategy {

    private static final Pattern RANGE_PATTERN = Pattern.compile("^\\s*(-?\\d+(?:\\.\\d+)?)\\s*-\\s*(-?\\d+(?:\\.\\d+)?)\\s*$");

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
        // 3. String: "min..max" or "min-max" (including negative bounds like "-5-10" or "-10--5")
        else if (targetValue instanceof String str) {
            String s = str.trim();
            if (s.contains("..")) {
                String[] parts = s.split("\\.\\.");
                if (parts.length >= 2) {
                    min = EqualsOperatorStrategy.tryToBigDecimal(parts[0]);
                    max = EqualsOperatorStrategy.tryToBigDecimal(parts[1]);
                }
            } else {
                Matcher m = RANGE_PATTERN.matcher(s);
                if (m.matches()) {
                    min = EqualsOperatorStrategy.tryToBigDecimal(m.group(1));
                    max = EqualsOperatorStrategy.tryToBigDecimal(m.group(2));
                }
            }
        }

        if (min == null || max == null) {
            return false;
        }

        return srcDec.compareTo(min) >= 0 && srcDec.compareTo(max) <= 0;
    }
}
