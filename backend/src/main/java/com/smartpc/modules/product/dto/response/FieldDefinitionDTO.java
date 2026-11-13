package com.smartpc.modules.product.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.product.schema.FieldType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FieldDefinitionDTO {

    private String key;

    private String label;

    private FieldType type;

    private boolean required;

    private boolean filterable;

    private String unit;

    @JsonProperty("min_value")
    private Double minValue;

    @JsonProperty("allowed_values")
    private List<String> allowedValues;
}
