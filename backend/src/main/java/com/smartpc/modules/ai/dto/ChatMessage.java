package com.smartpc.modules.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatMessage {

    private String role; // "user" | "assistant"
    private String content;
    private LocalDateTime timestamp;

    public ChatMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public ChatMessage(String role, String content) {
        this.role = role;
        this.content = content;
        this.timestamp = LocalDateTime.now();
    }

    public ChatMessage(String role, String content, LocalDateTime timestamp) {
        this.role = role;
        this.content = content;
        this.timestamp = (timestamp != null) ? timestamp : LocalDateTime.now();
    }

    public static ChatMessageBuilder builder() {
        return new ChatMessageBuilder();
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public static class ChatMessageBuilder {
        private String role;
        private String content;
        private LocalDateTime timestamp = LocalDateTime.now();

        public ChatMessageBuilder role(String role) {
            this.role = role;
            return this;
        }

        public ChatMessageBuilder content(String content) {
            this.content = content;
            return this;
        }

        public ChatMessageBuilder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public ChatMessage build() {
            return new ChatMessage(role, content, timestamp);
        }
    }
}
