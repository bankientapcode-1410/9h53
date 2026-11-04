package com.smartpc.modules.ruleengine.strategy;

import com.smartpc.modules.ruleengine.model.RuleOperator;

public interface OperatorStrategy {
    RuleOperator getOperator();
    boolean evaluate(Object sourceValue, Object targetValue);
}
