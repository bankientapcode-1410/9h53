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
 * Request khôi phục cấu hình PC từ liên kết chia sẻ (?items=...) (WBS 7.5.6).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveBuildRequest {

    @Builder.Default
    @Valid
    @Size(max = PCBuilderEvaluateRequest.MAX_REQUEST_ENTRIES, message = "Danh sách linh kiện khôi phục tối đa 100 phần tử")
    @JsonProperty("items")
    private List<BuildItemInput> items = new ArrayList<>();
}
