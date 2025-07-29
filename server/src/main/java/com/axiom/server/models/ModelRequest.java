package com.axiom.server.models;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ModelRequest {
    private List<Content> contents;

    public ModelRequest(String text) {
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
