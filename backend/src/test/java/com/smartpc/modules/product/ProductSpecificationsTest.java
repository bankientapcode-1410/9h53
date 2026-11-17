package com.smartpc.modules.product;

import com.smartpc.modules.product.repository.ProductSpecifications;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.smartpc.modules.product.repository.ProductSpecifications.detectCategoryIntent;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("TC-PROD-32: ProductSpecifications Search Intent Recognition")
class ProductSpecificationsTest {

    @Test
    @DisplayName("TC-PROD-32: Phân tách ý định tìm kiếm ổ cứng NVMe vs SATA vs chung")
    void testDetectCategoryIntent_StorageAndPeripherals() {
        assertEquals(List.of("SSD_M2", "SSD_SATA"), detectCategoryIntent("ssd"));
        assertEquals(List.of("SSD_M2", "SSD_SATA"), detectCategoryIntent("ổ cứng"));
        assertEquals(List.of("SSD_M2", "SSD_SATA"), detectCategoryIntent("ổ cứng lưu trữ"));

        assertEquals(List.of("SSD_SATA"), detectCategoryIntent("ssd sata"));
        assertEquals(List.of("SSD_SATA"), detectCategoryIntent("ổ cứng sata 1tb"));
        assertEquals(List.of("SSD_SATA"), detectCategoryIntent("ssd 2.5 inch"));

        assertEquals(List.of("SSD_M2"), detectCategoryIntent("ssd nvme pcie 4.0"));
        assertEquals(List.of("SSD_M2"), detectCategoryIntent("ổ cứng m.2 samsung"));

        // Đảm bảo kích thước màn hình 24.5 inch không bị nhận nhầm sang SSD_SATA
        assertEquals(List.of("MONITOR"), detectCategoryIntent("màn hình 24.5 inch 165hz"));
    }
}
