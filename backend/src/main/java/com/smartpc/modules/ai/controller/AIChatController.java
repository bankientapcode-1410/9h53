package com.smartpc.modules.ai.controller;

import com.smartpc.common.response.ApiResponse;
import com.smartpc.modules.ai.dto.ChatRequest;
import com.smartpc.modules.ai.dto.ChatResponse;
import com.smartpc.modules.ai.service.GeminiChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
public class AIChatController {

    private final GeminiChatService chatService;

    public AIChatController(GeminiChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(@Valid @RequestBody ChatRequest request) {
        ChatResponse response = chatService.sendMessage(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tư vấn AI thành công"));
    }
}
