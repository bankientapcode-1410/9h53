package com.smartpc.modules.product.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorySummaryDTO {

    @JsonProperty("category_id")
    private String categoryId;

    @JsonProperty("category_code")
    private String categoryCode;

    @JsonProperty("category_name")
    private String categoryName;
}
