package com.smartpc.modules.product.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Converter
public class FloatListJsonConverter implements AttributeConverter<List<Float>, String> {

    private static final Logger log = LoggerFactory.getLogger(FloatListJsonConverter.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<Float> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            log.error("Error serializing float list to JSON", e);
            return "[]";
        }
    }

    @Override
    public List<Float> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(dbData, new TypeReference<ArrayList<Float>>() {});
        } catch (IOException e) {
            log.error("Error deserializing JSON string to float list: {}", dbData, e);
            return new ArrayList<>();
        }
    }
}
