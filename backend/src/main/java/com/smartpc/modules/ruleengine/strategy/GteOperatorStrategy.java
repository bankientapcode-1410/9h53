package com.smartpc.modules.ruleengine.strategy;

import com.smartpc.modules.ruleengine.model.RuleOperator;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class GteOperatorStrategy implements OperatorStrategy {

    @Override
    public RuleOperator getOperator() {
        return RuleOperator.GTE;
    }

    @Override
    public boolean evaluate(Object sourceValue, Object targetValue) {
        if (sourceValue == null || targetValue == null) {
            return false;
        }

        BigDecimal srcDec = EqualsOperatorStrategy.tryToBigDecimal(sourceValue);
        BigDecimal tgtDec = EqualsOperatorStrategy.tryToBigDecimal(targetValue);
        if (srcDec == null || tgtDec == null) {
            return false;
        }

        return srcDec.compareTo(tgtDec) >= 0;
    }
}
