package com.smartpc.modules.product.schema;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldDefinition {
    private String key;
    private String label;
    private FieldType type;
    private boolean required;
    private boolean filterable;
    private String unit;
    private Double minValue;
    private List<String> allowedValues;
}
