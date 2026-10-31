package com.smartpc.modules.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

public class ChatResponse {

    private String reply;

    private List<String> suggestions = new ArrayList<>();

    @JsonProperty("is_fallback")
    private boolean fallback;

    public ChatResponse() {
    }

    public ChatResponse(String reply, List<String> suggestions, boolean fallback) {
        this.reply = reply;
        this.suggestions = (suggestions != null) ? suggestions : new ArrayList<>();
        this.fallback = fallback;
    }

    public static ChatResponseBuilder builder() {
        return new ChatResponseBuilder();
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = (suggestions != null) ? suggestions : new ArrayList<>();
    }

    public boolean isFallback() {
        return fallback;
    }

    public void setFallback(boolean fallback) {
        this.fallback = fallback;
    }

    public static class ChatResponseBuilder {
        private String reply;
        private List<String> suggestions = new ArrayList<>();
        private boolean fallback;

        public ChatResponseBuilder reply(String reply) {
            this.reply = reply;
            return this;
        }

        public ChatResponseBuilder suggestions(List<String> suggestions) {
            this.suggestions = suggestions;
            return this;
        }

        public ChatResponseBuilder fallback(boolean fallback) {
            this.fallback = fallback;
            return this;
        }

        public ChatResponse build() {
            return new ChatResponse(reply, suggestions, fallback);
        }
    }
}
