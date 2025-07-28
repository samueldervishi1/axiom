package com.chattr.server.models;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ChattrUltraRequest {
    private List<Content> contents;

    public ChattrUltraRequest(String text) {
        this.contents = List.of(new Content(List.of(new Part(text))));
    }

    @Data
    @AllArgsConstructor
    public static class Content {
        private List<Part> parts;
    }

    @Data
    @AllArgsConstructor
    public static class Part {
        private String text;
    }
}
