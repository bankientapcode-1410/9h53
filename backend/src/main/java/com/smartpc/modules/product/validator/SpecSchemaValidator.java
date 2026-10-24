package com.smartpc.modules.product.validator;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.FieldErrorDTO;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.schema.FieldDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class SpecSchemaValidator {

    private static final Pattern KEY_PATTERN = Pattern.compile("^[a-z][a-z0-9_]{0,63}$");
    private static final int MAX_SPECS_KEYS = 50;
    private static final int MAX_JSON_BYTES = 16384; // 16 KB

    private final CategorySpecSchemaRegistry schemaRegistry;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> validateSpecs(String categoryCode, Map<String, Object> specs) {
        if (!schemaRegistry.hasCategory(categoryCode)) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_NOT_LEAF,
                    "Danh mục " + categoryCode + " chưa có schema thông số kỹ thuật hoặc là danh mục nhóm");
        }

        List<FieldErrorDTO> errors = new ArrayList<>();
        Map<String, Object> normalizedSpecs = new LinkedHashMap<>();

        // S1: Not null, max 50 keys, total JSON size <= 16KB
        if (specs == null) {
            errors.add(new FieldErrorDTO("specs", "specs không được để trống"));
            throw new BusinessException(ErrorCode.PROD_INVALID_SPECS,
                    "Thông số kỹ thuật linh kiện không hợp lệ đối với danh mục " + categoryCode, errors);
        }

        if (specs.size() > MAX_SPECS_KEYS) {
            errors.add(new FieldErrorDTO("specs", "specs vượt quá giới hạn cho phép (tối đa 50 thuộc tính)"));
        }

        try {
            byte[] bytes = objectMapper.writeValueAsBytes(specs);
            if (bytes.length > MAX_JSON_BYTES) {
                errors.add(new FieldErrorDTO("specs", "specs vượt quá giới hạn cho phép (tối đa 16KB)"));
            }
        } catch (JsonProcessingException ignored) {
        }

        // S2: Every key format validation
        for (String key : specs.keySet()) {
            if (key == null || !KEY_PATTERN.matcher(key).matches()) {
                errors.add(new FieldErrorDTO("specs." + key, "Khóa '" + key + "' sai định dạng snake_case"));
            }
        }

        List<FieldDefinition> definitions = schemaRegistry.getSchema(categoryCode);
        Map<String, FieldDefinition> defMap = schemaRegistry.getSchemaAsMap(categoryCode);

        // S3: Required fields check
        for (FieldDefinition def : definitions) {
            if (def.isRequired()) {
                Object val = specs.get(def.getKey());
                if (val == null) {
                    errors.add(new FieldErrorDTO("specs." + def.getKey(),
                            "Trường '" + def.getKey() + "' là bắt buộc đối với danh mục " + categoryCode));
                } else if (val instanceof String s && s.isBlank()) {
                    errors.add(new FieldErrorDTO("specs." + def.getKey(),
                            "Trường '" + def.getKey() + "' là bắt buộc đối với danh mục " + categoryCode));
                } else if (val instanceof Collection<?> c && c.isEmpty()) {
                    errors.add(new FieldErrorDTO("specs." + def.getKey(),
                            "Trường '" + def.getKey() + "' là bắt buộc đối với danh mục " + categoryCode));
                }
            }
        }

        // S4, S5, S6: Type, MinValue, AllowedValues
        for (Map.Entry<String, Object> entry : specs.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (value == null) {
                continue;
            }

            FieldDefinition def = defMap.get(key);
            if (def != null) {
                validateAndNormalizeField(def, value, normalizedSpecs, errors);
            } else {
                // S7: Key not in schema is accepted as-is
                if (value instanceof String s) {
                    normalizedSpecs.put(key, s.trim());
                } else {
                    normalizedSpecs.put(key, value);
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new BusinessException(ErrorCode.PROD_INVALID_SPECS,
                    "Thông số kỹ thuật linh kiện không hợp lệ đối với danh mục " + categoryCode, errors);
        }

        return normalizedSpecs;
    }

    private void validateAndNormalizeField(FieldDefinition def, Object value,
                                          Map<String, Object> normalizedSpecs,
                                          List<FieldErrorDTO> errors) {
        String key = def.getKey();
        switch (def.getType()) {
            case STRING -> {
                String strVal = String.valueOf(value).trim();
                if (def.getAllowedValues() != null && !def.getAllowedValues().isEmpty()) {
                    String canonicalVal = null;
                    for (String allowed : def.getAllowedValues()) {
                        if (allowed.equalsIgnoreCase(strVal)) {
                            canonicalVal = allowed;
                            break;
                        }
                    }
                    if (canonicalVal != null) {
                        normalizedSpecs.put(key, canonicalVal);
                    } else {
                        errors.add(new FieldErrorDTO("specs." + key,
                                key + " chỉ nhận " + String.join(", ", def.getAllowedValues())));
                    }
                } else {
                    normalizedSpecs.put(key, strVal);
                }
            }
            case NUMBER -> {
                Double numVal = null;
                if (value instanceof Number n) {
                    numVal = n.doubleValue();
                } else if (value instanceof String s) {
                    try {
                        numVal = Double.parseDouble(s.trim());
                    } catch (NumberFormatException e) {
                        errors.add(new FieldErrorDTO("specs." + key, "Trường '" + key + "' phải là số"));
                    }
                } else {
                    errors.add(new FieldErrorDTO("specs." + key, "Trường '" + key + "' phải là số"));
                }

                if (numVal != null) {
                    if (def.getMinValue() != null && numVal < def.getMinValue()) {
                        errors.add(new FieldErrorDTO("specs." + key, "Trường '" + key + "' phải là số dương"));
                    }
                    if (def.getAllowedValues() != null && !def.getAllowedValues().isEmpty()) {
                        boolean matched = false;
                        for (String allowed : def.getAllowedValues()) {
                            try {
                                if (Math.abs(Double.parseDouble(allowed) - numVal) < 0.00001) {
                                    matched = true;
                                    break;
                                }
                            } catch (Exception ignored) {
                            }
                        }
                        if (!matched) {
                            errors.add(new FieldErrorDTO("specs." + key,
                                    key + " chỉ nhận " + String.join(", ", def.getAllowedValues())));
                        }
                    }
                    // If it is an integer value, store as int/long or double
                    if (numVal == Math.floor(numVal) && !Double.isInfinite(numVal)) {
                        normalizedSpecs.put(key, numVal.intValue());
                    } else {
                        normalizedSpecs.put(key, numVal);
                    }
                }
            }
            case INTEGER -> {
                Long intVal = null;
                if (value instanceof Number n) {
                    double d = n.doubleValue();
                    if (d != Math.floor(d) || Double.isInfinite(d) || Double.isNaN(d)) {
                        errors.add(new FieldErrorDTO("specs." + key, "Trường '" + key + "' phải là số nguyên"));
                    } else {
                        intVal = n.longValue();
                    }
                } else if (value instanceof String s) {
                    try {
                        intVal = Long.parseLong(s.trim());
                    } catch (NumberFormatException e) {
                        errors.add(new FieldErrorDTO("specs." + key, "Trường '" + key + "' phải là số nguyên"));
                    }
                } else {
                    errors.add(new FieldErrorDTO("specs." + key, "Trường '" + key + "' phải là số nguyên"));
                }

                if (intVal != null) {
                    if (def.getMinValue() != null && intVal < def.getMinValue().longValue()) {
                        errors.add(new FieldErrorDTO("specs." + key,
                                "Trường '" + key + "' phải lớn hơn hoặc bằng " + def.getMinValue().longValue()));
                    }
                    if (def.getAllowedValues() != null && !def.getAllowedValues().isEmpty()) {
                        String valStr = String.valueOf(intVal);
                        boolean matched = false;
                        for (String allowed : def.getAllowedValues()) {
                            if (allowed.trim().equalsIgnoreCase(valStr)) {
                                matched = true;
                                break;
                            }
                        }
                        if (!matched) {
                            errors.add(new FieldErrorDTO("specs." + key,
                                    key + " chỉ nhận " + String.join(", ", def.getAllowedValues())));
                        }
                    }
                    normalizedSpecs.put(key, intVal.intValue());
                }
            }
            case BOOLEAN -> {
                Boolean boolVal = null;
                if (value instanceof Boolean b) {
                    boolVal = b;
                } else if (value instanceof String s) {
                    String trim = s.trim().toLowerCase();
                    if ("true".equals(trim)) {
                        boolVal = true;
                    } else if ("false".equals(trim)) {
                        boolVal = false;
                    } else {
                        errors.add(new FieldErrorDTO("specs." + key,
                                "Trường '" + key + "' phải là giá trị boolean (true/false)"));
                    }
                } else {
                    errors.add(new FieldErrorDTO("specs." + key,
                                "Trường '" + key + "' phải là giá trị boolean (true/false)"));
                }
                if (boolVal != null) {
                    normalizedSpecs.put(key, boolVal);
                }
            }
            case ARRAY_STRING -> {
                List<String> list = new ArrayList<>();
                if (value instanceof Collection<?> col) {
                    boolean hasInvalid = false;
                    for (Object item : col) {
                        if (item == null || item.toString().isBlank()) {
                            hasInvalid = true;
                            break;
                        }
                        list.add(item.toString().trim());
                    }
                    if (hasInvalid) {
                        errors.add(new FieldErrorDTO("specs." + key,
                                "Trường '" + key + "' không được chứa phần tử rỗng"));
                    } else if (!list.isEmpty()) {
                        normalizedSpecs.put(key, list);
                    }
                } else if (value instanceof String s) {
                    if (!s.isBlank()) {
                        list.add(s.trim());
                        normalizedSpecs.put(key, list);
                    }
                } else {
                    errors.add(new FieldErrorDTO("specs." + key,
                            "Trường '" + key + "' phải là danh sách chuỗi"));
                }
            }
        }
    }
}
