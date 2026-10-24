package com.smartpc.modules.product.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(min = 3, max = 255, message = "Tên sản phẩm phải từ 3 đến 255 ký tự")
    private String name;

    @NotBlank(message = "Thương hiệu không được để trống")
    @Size(min = 1, max = 100, message = "Thương hiệu phải từ 1 đến 100 ký tự")
    private String brand;

    @NotBlank(message = "Mã danh mục không được để trống")
    @JsonProperty("category_code")
    private String categoryCode;

    private String description;

    @Size(max = 2048, message = "URL hình ảnh không được vượt quá 2048 ký tự")
    @JsonProperty("image_url")
    private String imageUrl;

    @Size(max = 10, message = "Tối đa 10 ảnh trong bộ sưu tập")
    @JsonProperty("gallery_urls")
    @Builder.Default
    private List<@Size(max = 2048, message = "URL hình ảnh không được vượt quá 2048 ký tự") String> galleryUrls = new ArrayList<>();

    @NotNull(message = "Giá sản phẩm không được để trống")
    @Min(value = 1, message = "Giá sản phẩm phải lớn hơn 0")
    @Max(value = 2000000000, message = "Giá sản phẩm không được vượt quá 2.000.000.000 VND")
    private Integer price;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    @Min(value = 0, message = "Số lượng tồn kho không được âm")
    @JsonProperty("stock_quantity")
    private Integer stockQuantity;

    @Min(value = 0, message = "Điểm benchmark chuẩn hóa phải từ 0 đến 100")
    @Max(value = 100, message = "Điểm benchmark chuẩn hóa phải từ 0 đến 100")
    @JsonProperty("benchmark_score")
    @Builder.Default
    private Double benchmarkScore = 0.0;

    @JsonProperty("is_active")
    @Builder.Default
    private Boolean isActive = true;

    @NotNull(message = "Thông số kỹ thuật specs không được để trống")
    @Builder.Default
    private Map<String, Object> specs = new LinkedHashMap<>();
}
