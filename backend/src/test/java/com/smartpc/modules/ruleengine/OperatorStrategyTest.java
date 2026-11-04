package com.smartpc.modules.ruleengine;

import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.strategy.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class OperatorStrategyTest {

    private EqualsOperatorStrategy equalsStrategy;
    private InOperatorStrategy inStrategy;
    private NotInOperatorStrategy notInStrategy;
    private LteOperatorStrategy lteStrategy;
    private GteOperatorStrategy gteStrategy;
    private RangeOperatorStrategy rangeStrategy;

    @BeforeEach
    void setUp() {
        equalsStrategy = new EqualsOperatorStrategy();
        inStrategy = new InOperatorStrategy(equalsStrategy);
        notInStrategy = new NotInOperatorStrategy(inStrategy);
        lteStrategy = new LteOperatorStrategy();
        gteStrategy = new GteOperatorStrategy();
        rangeStrategy = new RangeOperatorStrategy();
    }

    @Test
    @DisplayName("TC-RE-05a: EqualsOperatorStrategy xử lý chuẩn số, boolean và chuỗi")
    void testEqualsStrategy() {
        assertEquals(RuleOperator.EQUALS, equalsStrategy.getOperator());

        // Numeric comparison (320 == 320.0)
        assertTrue(equalsStrategy.evaluate(320, 320.0));
        assertTrue(equalsStrategy.evaluate("320", 320.0));
        assertTrue(equalsStrategy.evaluate(new BigDecimal("320.00"), 320));
        assertFalse(equalsStrategy.evaluate(320, 350));

        // Boolean comparison
        assertTrue(equalsStrategy.evaluate(true, "true"));
        assertTrue(equalsStrategy.evaluate("false", false));
        assertFalse(equalsStrategy.evaluate(true, false));

        // String ignore case
        assertTrue(equalsStrategy.evaluate("atx", "ATX"));
        assertTrue(equalsStrategy.evaluate(" DDR5 ", "ddr5"));
        assertFalse(equalsStrategy.evaluate("LGA1700", "AM5"));

        // Null safety
        assertFalse(equalsStrategy.evaluate(null, "val"));
        assertFalse(equalsStrategy.evaluate("val", null));
    }

    @Test
    @DisplayName("TC-RE-05b: InOperatorStrategy và NotInOperatorStrategy kiểm tra phần tử trong mảng/chuỗi/giao tập hợp")
    void testInAndNotInStrategy() {
        assertEquals(RuleOperator.IN, inStrategy.getOperator());
        assertEquals(RuleOperator.NOT_IN, notInStrategy.getOperator());

        List<String> sockets = List.of("LGA1700", "LGA1851");

        // Scalar in List
        assertTrue(inStrategy.evaluate("LGA1700", sockets));
        assertTrue(inStrategy.evaluate("lga1700", sockets));
        assertFalse(inStrategy.evaluate("AM5", sockets));

        // NOT_IN
        assertFalse(notInStrategy.evaluate("LGA1700", sockets));
        assertTrue(notInStrategy.evaluate("AM5", sockets));

        // Comma separated string target
        assertTrue(inStrategy.evaluate("LGA1700", "LGA1700, LGA1851"));
        assertFalse(inStrategy.evaluate("AM5", "LGA1700, LGA1851"));

        // Collection intersection
        List<String> supportedByCase = List.of("ATX", "M-ATX");
        List<String> mbTypes = List.of("M-ATX", "ITX");
        assertTrue(inStrategy.evaluate(mbTypes, supportedByCase));

        List<String> incompatibleTypes = List.of("E-ATX");
        assertFalse(inStrategy.evaluate(incompatibleTypes, List.of("ITX")));
    }

    @Test
    @DisplayName("TC-RE-05c: LteOperatorStrategy và GteOperatorStrategy so sánh số học an toàn")
    void testLteAndGteStrategy() {
        assertEquals(RuleOperator.LTE, lteStrategy.getOperator());
        assertEquals(RuleOperator.GTE, gteStrategy.getOperator());

        // LTE
        assertTrue(lteStrategy.evaluate(300, 320));
        assertTrue(lteStrategy.evaluate(320, 320.0));
        assertFalse(lteStrategy.evaluate(357.6, 320));

        // GTE
        assertTrue(gteStrategy.evaluate(750, 650));
        assertTrue(gteStrategy.evaluate(650.0, 650));
        assertFalse(gteStrategy.evaluate(450, 650));

        // Invalid number format fallback
        assertFalse(lteStrategy.evaluate("invalid", 320));
        assertFalse(gteStrategy.evaluate(750, null));
    }

    @Test
    @DisplayName("TC-RE-05d: RangeOperatorStrategy hỗ trợ List [min, max], Map {min, max} và chuỗi 'min..max'")
    void testRangeStrategy() {
        assertEquals(RuleOperator.RANGE, rangeStrategy.getOperator());

        // List [min, max]
        assertTrue(rangeStrategy.evaluate(1.25, List.of(1.1, 1.4)));
        assertTrue(rangeStrategy.evaluate(1.1, List.of(1.1, 1.4)));
        assertTrue(rangeStrategy.evaluate(1.4, List.of(1.1, 1.4)));
        assertFalse(rangeStrategy.evaluate(1.5, List.of(1.1, 1.4)));
        assertFalse(rangeStrategy.evaluate(1.0, List.of(1.1, 1.4)));

        // Map {min, max}
        assertTrue(rangeStrategy.evaluate(1.25, Map.of("min", 1.1, "max", 1.4)));
        assertFalse(rangeStrategy.evaluate(1.6, Map.of("min", 1.1, "max", 1.4)));

        // String "min..max" or "min-max"
        assertTrue(rangeStrategy.evaluate(1.25, "1.1..1.4"));
        assertTrue(rangeStrategy.evaluate(1.25, "1.1-1.4"));
        assertFalse(rangeStrategy.evaluate(1.05, "1.1..1.4"));
    }
}
