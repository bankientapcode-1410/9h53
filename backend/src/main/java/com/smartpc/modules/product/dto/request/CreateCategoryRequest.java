package com.smartpc.modules.product.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {

    @NotBlank(message = "Mã danh mục không được để trống")
    @Pattern(regexp = "^[A-Z][A-Z0-9_]{1,49}$", message = "Mã danh mục phải viết hoa, bắt đầu bằng chữ cái, từ 2 đến 50 ký tự (chỉ gồm A-Z, 0-9, _)")
    @JsonProperty("category_code")
    private String categoryCode;

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 255, message = "Tên danh mục không được vượt quá 255 ký tự")
    @JsonProperty("category_name")
    private String categoryName;

    private String description;

    @JsonProperty("parent_category_id")
    private String parentCategoryId;
}
