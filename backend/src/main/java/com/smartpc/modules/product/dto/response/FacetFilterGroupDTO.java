package com.smartpc.modules.product.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FacetFilterGroupDTO {

    @JsonProperty("group_key")
    private String groupKey;

    @JsonProperty("group_label")
    private String groupLabel;

    @Builder.Default
    private List<FacetOptionDTO> options = new ArrayList<>();

    @JsonProperty("min_price")
    private Integer minPrice;

    @JsonProperty("max_price")
    private Integer maxPrice;
}
