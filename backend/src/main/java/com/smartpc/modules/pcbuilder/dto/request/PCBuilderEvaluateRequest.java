package com.smartpc.modules.pcbuilder.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Request đánh giá tương thích & tính telemetry cấu hình PC.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PCBuilderEvaluateRequest {

    public static final int MAX_REQUEST_ENTRIES = 100;

    @Builder.Default
    @Valid
    @Size(max = MAX_REQUEST_ENTRIES, message = "Danh sách linh kiện đánh giá tối đa 100 phần tử")
    @JsonProperty("items")
    private List<BuildItemInput> items = new ArrayList<>();
}
