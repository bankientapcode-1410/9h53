package com.smartpc.modules.product.dto.response;

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
public class BatchSyncAcceptedDTO {

    @JsonProperty("job_id")
    private String jobId;

    private Integer accepted;

    @Builder.Default
    private List<BatchRejectedItem> rejected = new ArrayList<>();
}
