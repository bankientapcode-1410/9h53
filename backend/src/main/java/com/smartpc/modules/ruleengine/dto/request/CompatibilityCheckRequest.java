package com.smartpc.modules.ruleengine.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
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
public class CompatibilityCheckRequest {

    /** Giới hạn số phần tử mảng đầu vào (DD-UC6 §4.6.A) để chống DoS. */
    public static final int MAX_REQUEST_ENTRIES = 100;

    @Builder.Default
    @Size(max = MAX_REQUEST_ENTRIES, message = "Danh sách product_ids tối đa 100 phần tử")
    @JsonProperty("product_ids")
    private List<String> productIds = new ArrayList<>();

    @Builder.Default
    @Valid
    @Size(max = MAX_REQUEST_ENTRIES, message = "Danh sách items tối đa 100 phần tử")
    @JsonProperty("items")
    private List<CompatibilityItemRequest> items = new ArrayList<>();
}
