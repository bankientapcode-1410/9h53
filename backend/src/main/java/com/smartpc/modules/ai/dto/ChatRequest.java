package com.smartpc.modules.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class ChatRequest {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    @Size(max = 2000, message = "Nội dung câu hỏi không được vượt quá 2000 ký tự")
    private String message;

    private List<ChatMessage> history = new ArrayList<>();

    public ChatRequest() {
    }

    public ChatRequest(String message, List<ChatMessage> history) {
        this.message = message;
        this.history = (history != null) ? history : new ArrayList<>();
    }

    public static ChatRequestBuilder builder() {
        return new ChatRequestBuilder();
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<ChatMessage> getHistory() {
        return history;
    }

    public void setHistory(List<ChatMessage> history) {
        this.history = (history != null) ? history : new ArrayList<>();
    }

    public static class ChatRequestBuilder {
        private String message;
        private List<ChatMessage> history = new ArrayList<>();

        public ChatRequestBuilder message(String message) {
            this.message = message;
            return this;
        }

        public ChatRequestBuilder history(List<ChatMessage> history) {
            this.history = history;
            return this;
        }

        public ChatRequest build() {
            return new ChatRequest(message, history);
        }
    }
}
