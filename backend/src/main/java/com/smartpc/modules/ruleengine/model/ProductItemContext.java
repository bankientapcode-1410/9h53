package com.smartpc.modules.ruleengine.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductItemContext {
    private String productId;
    private String productName;
    private String categoryCode;

    @Builder.Default
    private Map<String, Object> specs = new LinkedHashMap<>();

    @Builder.Default
    private int quantity = 1;
}
