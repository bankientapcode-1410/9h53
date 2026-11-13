package com.smartpc.modules.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpc.modules.ai.dto.ChatMessage;
import com.smartpc.modules.ai.dto.ChatRequest;
import com.smartpc.modules.ai.dto.ChatResponse;
import com.smartpc.modules.ai.service.GeminiChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class GeminiChatServiceTest {

    private GeminiChatService chatService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        chatService = new GeminiChatService(objectMapper);
    }

    @Test
    @DisplayName("TC-CHAT-01: Tự động fallback thông minh khi chưa có API Key")
    void testSendMessage_FallbackWhenNoApiKey() {
        ChatRequest request = ChatRequest.builder()
                .message("Tư vấn cấu hình máy tính văn phòng")
                .build();

        ChatResponse response = chatService.sendMessage(request);

        assertNotNull(response);
        assertTrue(response.isFallback());
        assertNotNull(response.getReply());
        assertFalse(response.getReply().isBlank());
        assertNotNull(response.getSuggestions());
        assertFalse(response.getSuggestions().isEmpty());
    }

    @Test
    @DisplayName("TC-CHAT-02: Fallback chuyên sâu cho câu hỏi ngân sách 15 triệu (tập trung hàng sẵn kho)")
    void testSendMessage_FallbackFor15MillionBudget() {
        ChatRequest request = ChatRequest.builder()
                .message("Tư vấn cấu hình khoảng 15 triệu chơi game")
                .build();

        ChatResponse response = chatService.sendMessage(request);

        assertNotNull(response);
        assertTrue(response.isFallback());
        assertTrue(response.getReply().contains("15 triệu") || response.getReply().contains("SmartPC"));
        assertTrue(response.getReply().contains("RTX 4060"));
        assertTrue(response.getReply().contains("i5-13600K"));
    }

    @Test
    @DisplayName("TC-CHAT-03: Fallback chuyên sâu cho câu hỏi tư vấn Card đồ họa (VGA có sẵn trong kho)")
    void testSendMessage_FallbackForVgaAdvice() {
        ChatRequest request = ChatRequest.builder()
                .message("Card màn hình nào chơi game tốt nhất?")
                .build();

        ChatResponse response = chatService.sendMessage(request);

        assertNotNull(response);
        assertTrue(response.isFallback());
        assertTrue(response.getReply().contains("RTX 4060"));
        assertTrue(response.getReply().contains("RTX 4070 Ti SUPER"));
    }

    @Test
    @DisplayName("TC-CHAT-04: Lưu giữ lịch sử hội thoại trong ChatRequest")
    void testSendMessage_WithChatHistory() {
        ChatRequest request = ChatRequest.builder()
                .message("Mình muốn kiểm tra nguồn Corsair RM750e có đủ không?")
                .history(List.of(
                        ChatMessage.builder().role("user").content("Tư vấn cấu hình có RTX 4060").build(),
                        ChatMessage.builder().role("assistant").content("Dàn máy ASUS RTX 4060 + i5 13600K").build()
                ))
                .build();

        ChatResponse response = chatService.sendMessage(request);

        assertNotNull(response);
        assertNotNull(response.getReply());
    }

    @Test
    @DisplayName("TC-CHAT-05: Ngữ cảnh kho hàng Store Catalog bao gồm các linh kiện thực tế")
    void testGetStoreCatalogContext() {
        String catalog = chatService.getStoreCatalogContext();
        assertNotNull(catalog);
        assertTrue(catalog.contains("RTX 4060"));
        assertTrue(catalog.contains("i5-13600K"));
        assertTrue(catalog.contains("Ryzen 7 7800X3D"));
        assertTrue(catalog.contains("KC3000"));
        assertTrue(catalog.contains("Corsair RM750e"));
    }
}
