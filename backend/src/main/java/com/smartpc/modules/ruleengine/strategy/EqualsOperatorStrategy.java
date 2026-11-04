package com.smartpc.modules.ruleengine.strategy;

import com.smartpc.modules.ruleengine.model.RuleOperator;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class EqualsOperatorStrategy implements OperatorStrategy {

    @Override
    public RuleOperator getOperator() {
        return RuleOperator.EQUALS;
    }

    @Override
    public boolean evaluate(Object sourceValue, Object targetValue) {
        if (sourceValue == null || targetValue == null) {
            return false;
        }

        // 1. Try numeric comparison with BigDecimal (handles 320 == 320.0)
        BigDecimal srcDec = tryToBigDecimal(sourceValue);
        BigDecimal tgtDec = tryToBigDecimal(targetValue);
        if (srcDec != null && tgtDec != null) {
            return srcDec.compareTo(tgtDec) == 0;
        }

        // 2. Try Boolean comparison
        String srcStr = sourceValue.toString().trim();
        String tgtStr = targetValue.toString().trim();
        if (isBoolean(srcStr) && isBoolean(tgtStr)) {
            return Boolean.parseBoolean(srcStr) == Boolean.parseBoolean(tgtStr);
        }

        // 3. String comparison ignore-case
        return srcStr.equalsIgnoreCase(tgtStr);
    }

    private static boolean isBoolean(String str) {
        return "true".equalsIgnoreCase(str) || "false".equalsIgnoreCase(str);
    }

    static BigDecimal tryToBigDecimal(Object val) {
        if (val == null) return null;
        if (val instanceof BigDecimal bd) return bd;
        if (val instanceof Number n) {
            double d = n.doubleValue();
            if (!Double.isFinite(d)) return null;
            try {
                return BigDecimal.valueOf(d);
            } catch (Exception e) {
                return null;
            }
        }
        try {
            String s = val.toString().trim();
            double d = Double.parseDouble(s);
            if (!Double.isFinite(d)) return null;
            return new BigDecimal(s);
        } catch (Exception e) {
            return null;
        }
    }
}
