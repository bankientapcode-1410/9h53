package com.smartpc.modules.ruleengine.strategy;

import com.smartpc.modules.ruleengine.model.RuleOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotInOperatorStrategy implements OperatorStrategy {

    private final InOperatorStrategy inStrategy;

    @Override
    public RuleOperator getOperator() {
        return RuleOperator.NOT_IN;
    }

    @Override
    public boolean evaluate(Object sourceValue, Object targetValue) {
        return !inStrategy.evaluate(sourceValue, targetValue);
    }
}
