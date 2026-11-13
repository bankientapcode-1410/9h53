package com.smartpc.modules.ruleengine.strategy;

import com.smartpc.modules.ruleengine.model.RuleOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

@Component
@RequiredArgsConstructor
public class InOperatorStrategy implements OperatorStrategy {

    private final EqualsOperatorStrategy equalsStrategy;

    @Override
    public RuleOperator getOperator() {
        return RuleOperator.IN;
    }

    @Override
    public boolean evaluate(Object sourceValue, Object targetValue) {
        if (sourceValue == null || targetValue == null) {
            return false;
        }

        Collection<?> targetCollection = toCollection(targetValue);
        if (targetCollection == null) {
            return equalsStrategy.evaluate(sourceValue, targetValue);
        }

        if (sourceValue instanceof Collection<?> srcCollection) {
            // Intersection: return true if any source element matches any target element
            for (Object srcElem : srcCollection) {
                for (Object tgtElem : targetCollection) {
                    if (equalsStrategy.evaluate(srcElem, tgtElem)) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Scalar in Collection
        for (Object tgtElem : targetCollection) {
            if (equalsStrategy.evaluate(sourceValue, tgtElem)) {
                return true;
            }
        }
        return false;
    }

    private Collection<?> toCollection(Object val) {
        if (val instanceof Collection<?> col) {
            return col;
        }
        if (val instanceof Object[] arr) {
            return Arrays.asList(arr);
        }
        if (val instanceof String s && s.contains(",")) {
            return Arrays.stream(s.split(","))
                    .map(String::trim)
                    .filter(part -> !part.isEmpty())
                    .toList();
        }
        return null;
    }
}
