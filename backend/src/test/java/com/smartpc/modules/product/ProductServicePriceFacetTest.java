package com.smartpc.modules.product;

import com.smartpc.modules.product.dto.response.FacetOptionDTO;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ProductServicePriceFacetTest {

    private static Product productWithPrice(int price) {
        return Product.builder().price(price).build();
    }

    @Test
    @DisplayName("TC-PROD-28a: Empty buckets are hidden and min/max outer buckets are promoted")
    void shouldHideEmptyBucketsAndPromoteOuterBounds() {
        List<Product> products = List.of(
                productWithPrice(2_500_000),
                productWithPrice(4_500_000),
                productWithPrice(6_500_000),
                productWithPrice(8_000_000)
        );

        List<FacetOptionDTO> options = ProductService.buildDynamicPriceOptions(products);

        assertThat(options).hasSize(2);
        assertThat(options.get(0).getLabel()).isEqualTo("Dưới 5 triệu");
        assertThat(options.get(0).getValue()).isEqualTo("0-5000000");
        assertThat(options.get(0).getCount()).isEqualTo(2L);

        assertThat(options.get(1).getLabel()).isEqualTo("Trên 5 triệu");
        assertThat(options.get(1).getValue()).isEqualTo("5000000-999999999");
        assertThat(options.get(1).getCount()).isEqualTo(2L);
    }

    @Test
    @DisplayName("TC-PROD-28b: Gap in middle buckets is hidden while outer buckets keep/promote properly")
    void shouldHideMiddleGapAndKeepUpperBoundWhenPresent() {
        List<Product> products = List.of(
                productWithPrice(3_000_000),
                productWithPrice(18_000_000),
                productWithPrice(30_000_000)
        );

        List<FacetOptionDTO> options = ProductService.buildDynamicPriceOptions(products);

        assertThat(options).hasSize(3);
        assertThat(options.get(0).getLabel()).isEqualTo("Dưới 5 triệu");
        assertThat(options.get(0).getValue()).isEqualTo("0-5000000");

        assertThat(options.get(1).getLabel()).isEqualTo("15 - 25 triệu");
        assertThat(options.get(1).getValue()).isEqualTo("15000000-25000000");

        assertThat(options.get(2).getLabel()).isEqualTo("Trên 25 triệu");
        assertThat(options.get(2).getValue()).isEqualTo("25000000-999999999");
    }

    @Test
    @DisplayName("TC-PROD-28c: Single bucket above 25M stays Trên 25 triệu")
    void shouldKeepUnboundedMaxWhenOnlyTopBucketHasProducts() {
        List<Product> products = List.of(productWithPrice(35_000_000));

        List<FacetOptionDTO> options = ProductService.buildDynamicPriceOptions(products);

        assertThat(options).hasSize(1);
        assertThat(options.get(0).getLabel()).isEqualTo("Trên 25 triệu");
        assertThat(options.get(0).getValue()).isEqualTo("25000000-999999999");
        assertThat(options.get(0).getCount()).isEqualTo(1L);
    }
}
