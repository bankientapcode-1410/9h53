package com.smartpc.modules.product;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.FieldErrorDTO;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.validator.SpecSchemaValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SpecSchemaValidatorTest {

    private SpecSchemaValidator validator;

    @BeforeEach
    void setUp() {
        CategorySpecSchemaRegistry registry = new CategorySpecSchemaRegistry();
        validator = new SpecSchemaValidator(registry);
    }

    @Test
    @DisplayName("TC-PROD-01: Specs CPU hợp lệ")
    void testValidateSpecs_ValidCPU() {
        Map<String, Object> specs = new LinkedHashMap<>();
        specs.put("socket_type", "LGA1700");
        specs.put("tdp_w", 125);
        specs.put("core_count", 14);

        Map<String, Object> normalized = validator.validateSpecs("CPU", specs);

        assertNotNull(normalized);
        assertEquals("LGA1700", normalized.get("socket_type"));
        assertEquals(125, normalized.get("tdp_w"));
        assertEquals(14, normalized.get("core_count"));
    }

    @Test
    @DisplayName("TC-PROD-02: Thiếu trường bắt buộc gom đủ lỗi")
    void testValidateSpecs_MissingRequired_AggregatesAllErrors() {
        Map<String, Object> specs = new LinkedHashMap<>();
        specs.put("tdp_w", 125); // Missing socket_type and core_count

        BusinessException ex = assertThrows(BusinessException.class, () ->
                validator.validateSpecs("CPU", specs));

        assertEquals(ErrorCode.PROD_INVALID_SPECS.getCode(), ex.getErrorCode());
        assertNotNull(ex.getErrors());

        boolean hasSocketError = ex.getErrors().stream().anyMatch(e -> "specs.socket_type".equals(e.getField()));
        boolean hasCoreError = ex.getErrors().stream().anyMatch(e -> "specs.core_count".equals(e.getField()));

        assertTrue(hasSocketError, "Phải báo lỗi thiếu specs.socket_type");
        assertTrue(hasCoreError, "Phải báo lỗi thiếu specs.core_count");
    }

    @Test
    @DisplayName("TC-PROD-03: Sai kiểu dữ liệu vram_gb không phải số nguyên")
    void testValidateSpecs_InvalidFieldType() {
        Map<String, Object> specs = new LinkedHashMap<>();
        specs.put("vram_gb", "TAM_GIGA");
        specs.put("length_mm", 242.0);
        specs.put("tdp_w", 200.0);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                validator.validateSpecs("GPU", specs));

        assertEquals(ErrorCode.PROD_INVALID_SPECS.getCode(), ex.getErrorCode());
        assertTrue(ex.getErrors().stream().anyMatch(e -> "specs.vram_gb".equals(e.getField())),
                "Phải chứa lỗi cho trường specs.vram_gb");
    }

    @Test
    @DisplayName("TC-PROD-04: Chuẩn hóa allowedValues (ddr5 -> DDR5) và ép kiểu số (chuỗi số -> số nguyên)")
    void testValidateSpecs_NormalizationAndAllowedValues() {
        Map<String, Object> specs = new LinkedHashMap<>();
        specs.put("memory_type", "ddr5"); // Lowercase, should normalize to DDR5
        specs.put("capacity_gb", "32"); // String number, should normalize to integer 32
        specs.put("bus_speed_mhz", 6000);
        specs.put("modules_per_kit", 2);

        Map<String, Object> normalized = validator.validateSpecs("RAM", specs);

        assertNotNull(normalized);
        assertEquals("DDR5", normalized.get("memory_type"));
        assertEquals(32, normalized.get("capacity_gb"));
        assertTrue(normalized.get("capacity_gb") instanceof Integer, "capacity_gb phải là kiểu Integer");
    }

    @Test
    @DisplayName("TC-PROD-25: Xác thực specs và chuẩn hóa thiết bị ngoại vi MONITOR, KEYBOARD, MOUSE")
    void testValidateSpecs_Peripherals() {
        // 1. MONITOR valid
        Map<String, Object> monitorSpecs = new LinkedHashMap<>();
        monitorSpecs.put("screen_size_inch", "27.0");
        monitorSpecs.put("resolution", "2K QHD (2560x1440)");
        monitorSpecs.put("refresh_rate_hz", "165");
        monitorSpecs.put("panel_type", "ips"); // Should normalize to IPS

        Map<String, Object> normMonitor = validator.validateSpecs("MONITOR", monitorSpecs);
        assertNotNull(normMonitor);
        assertEquals("IPS", normMonitor.get("panel_type"));
        assertEquals(165, normMonitor.get("refresh_rate_hz"));

        // 2. KEYBOARD missing required field
        Map<String, Object> badKeyboard = new LinkedHashMap<>();
        badKeyboard.put("connection_type", "Wireless");
        // missing switch_type, layout

        BusinessException ex = assertThrows(BusinessException.class, () ->
                validator.validateSpecs("KEYBOARD", badKeyboard));
        assertEquals(ErrorCode.PROD_INVALID_SPECS.getCode(), ex.getErrorCode());

        // 2b. KEYBOARD valid with "75%" and auto-normalization from "Compact 75%"
        Map<String, Object> keyboardSpecs = new LinkedHashMap<>();
        keyboardSpecs.put("connection_type", "Wireless");
        keyboardSpecs.put("switch_type", "Mechanical Red");
        keyboardSpecs.put("layout", "75%");
        Map<String, Object> normKb = validator.validateSpecs("KEYBOARD", keyboardSpecs);
        assertNotNull(normKb);
        assertEquals("75%", normKb.get("layout"));

        Map<String, Object> compactKb = new LinkedHashMap<>();
        compactKb.put("connection_type", "Wireless");
        compactKb.put("switch_type", "Mechanical Red");
        compactKb.put("layout", "Compact 75%");
        compactKb.put("led_type", "Rainbow");
        Map<String, Object> normCompactKb = validator.validateSpecs("KEYBOARD", compactKb);
        assertNotNull(normCompactKb);
        assertEquals("75%", normCompactKb.get("layout"));
        assertEquals("Rainbow", normCompactKb.get("led_type"));

        // 2c. TC-PROD-26: KEYBOARD led_type normalization and invalid checks
        Map<String, Object> monoKb = new LinkedHashMap<>();
        monoKb.put("connection_type", "Wired");
        monoKb.put("switch_type", "Mechanical Brown");
        monoKb.put("layout", "Fullsize 104");
        monoKb.put("led_type", "White LED");
        Map<String, Object> normMonoKb = validator.validateSpecs("KEYBOARD", monoKb);
        assertEquals("Monochrome", normMonoKb.get("led_type"));

        Map<String, Object> noneKb = new LinkedHashMap<>();
        noneKb.put("connection_type", "Wired");
        noneKb.put("switch_type", "Mechanical Blue");
        noneKb.put("layout", "Tenkeyless (TKL)");
        noneKb.put("led_type", "Không LED");
        Map<String, Object> normNoneKb = validator.validateSpecs("KEYBOARD", noneKb);
        assertEquals("None", normNoneKb.get("led_type"));

        Map<String, Object> invalidLedKb = new LinkedHashMap<>();
        invalidLedKb.put("connection_type", "Wired");
        invalidLedKb.put("switch_type", "Mechanical Red");
        invalidLedKb.put("layout", "75%");
        invalidLedKb.put("led_type", "Discolight");
        BusinessException ledEx = assertThrows(BusinessException.class, () ->
                validator.validateSpecs("KEYBOARD", invalidLedKb));
        assertEquals(ErrorCode.PROD_INVALID_SPECS.getCode(), ledEx.getErrorCode());

        // 3. MOUSE valid
        Map<String, Object> mouseSpecs = new LinkedHashMap<>();
        mouseSpecs.put("connection_type", "Wireless");
        mouseSpecs.put("dpi", "32000");
        mouseSpecs.put("weight_g", 60);

        Map<String, Object> normMouse = validator.validateSpecs("MOUSE", mouseSpecs);
        assertNotNull(normMouse);
        assertEquals(32000, normMouse.get("dpi"));
        assertEquals("Wireless", normMouse.get("connection_type"));
    }
}
