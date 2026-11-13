package com.smartpc.modules.product.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@Converter
public class SpecsJsonConverter implements AttributeConverter<Map<String, Object>, String> {

    private static final Logger log = LoggerFactory.getLogger(SpecsJsonConverter.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(Map<String, Object> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            log.error("Error serializing specs map to JSON string", e);
            return "{}";
        }
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(dbData, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (IOException e) {
            log.error("Error deserializing JSON string to specs map: {}", dbData, e);
            return new LinkedHashMap<>();
        }
    }
}
