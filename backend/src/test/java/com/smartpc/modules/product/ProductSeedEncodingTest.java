package com.smartpc.modules.product;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("TC-PROD-27: Product Seed Font & UTF-8 Encoding Verification")
class ProductSeedEncodingTest {

    @Test
    @DisplayName("TC-PROD-27: V8 migration contains proper Vietnamese accented text for RTX 4070 and other V7 products")
    void testV8MigrationContentEncoding() throws IOException {
        Path v8Path = Paths.get("src/main/resources/db/migration/V8__fix_seed_product_font_encoding.sql");
        if (!Files.exists(v8Path)) {
            v8Path = Paths.get("backend/src/main/resources/db/migration/V8__fix_seed_product_font_encoding.sql");
        }
        assertTrue(Files.exists(v8Path), "V8 migration file must exist");

        String content = Files.readString(v8Path, StandardCharsets.UTF_8);

        // Verify product 71 (RTX 4070 White)
        assertTrue(content.contains("Card màn hình ASUS Dual GeForce RTX 4070 White OC Edition 12GB GDDR6X"),
                "Product 71 name must contain correct Vietnamese text without question marks");
        assertTrue(content.contains("Card đồ họa tone màu trắng tuyết sang trọng"),
                "Product 71 description must have correct Vietnamese accents");

        // Verify other products
        assertTrue(content.contains("Card màn hình MSI GeForce RTX 4060 Ventus 2X Black 8GB GDDR6"));
        assertTrue(content.contains("Màn hình Gaming AOC 24G2SE 24 inch FHD VA 165Hz 1ms Cong"));
        assertTrue(content.contains("Màn hình Gaming Samsung Odyssey G3 24 inch FHD VA 144Hz 1ms Chân xoay"));
        assertTrue(content.contains("Bàn phím cơ không dây Akko 3084B Plus Black & Cyan Brown Switch"));
        assertTrue(content.contains("Bàn phím cơ có dây Razer Huntsman V2 Tenkeyless Optical Red Switch"));
        assertTrue(content.contains("Chuột gaming không dây Razer Basilisk V3 Pro 30000 DPI RGB"));
        assertTrue(content.contains("Chuột gaming không dây ASUS ROG Harpe Ace Aim Lab Edition 32000 DPI"));
        assertTrue(content.contains("Chuột gaming có dây Razer Viper Mini 8500 DPI Siêu nhẹ 61g"));
        assertTrue(content.contains("Bo mạch chủ GIGABYTE Z790 AORUS ELITE AX DDR5 ATX"));

        // Verify no ? inside Vietnamese words
        Pattern corruptedWordPattern = Pattern.compile("[a-zA-Z\\u00C0-\\u1EF9]\\?[a-zA-Z\\u00C0-\\u1EF9]");
        Matcher matcher = corruptedWordPattern.matcher(content);
        assertFalse(matcher.find(), "V8 migration must not contain any corrupted words with '?'");
    }

    @Test
    @DisplayName("TC-PROD-27: V7 migration file is properly UTF-8 encoded")
    void testV7MigrationFileEncoding() throws IOException {
        Path v7Path = Paths.get("src/main/resources/db/migration/V7__supplemental_test_seed_coverage.sql");
        if (!Files.exists(v7Path)) {
            v7Path = Paths.get("backend/src/main/resources/db/migration/V7__supplemental_test_seed_coverage.sql");
        }
        assertTrue(Files.exists(v7Path), "V7 migration file must exist");

        String content = Files.readString(v7Path, StandardCharsets.UTF_8);
        assertTrue(content.contains("Card màn hình ASUS Dual GeForce RTX 4070 White OC Edition 12GB GDDR6X"));

        // Verify no replacement characters or corrupted words
        assertFalse(content.contains("\uFFFD"), "V7 must not have Unicode replacement characters");
    }
}
