package com.smartpc.modules.product.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
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
public class BatchResyncRequest {

    @NotEmpty(message = "Danh sách ID sản phẩm không được rỗng")
    @Size(max = 100, message = "Số lượng sản phẩm yêu cầu đồng bộ tối đa là 100")
    @JsonProperty("product_ids")
    @Builder.Default
    private List<String> productIds = new ArrayList<>();
}
