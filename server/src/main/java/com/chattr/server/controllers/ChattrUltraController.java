package com.chattr.server.controllers;

import com.chattr.server.models.ChatRequest;
import com.chattr.server.models.ChattrUltra;
import com.chattr.server.services.ChattrUltraService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ask")
@Slf4j
public class ChattrUltraController {

    private final ChattrUltraService geminiChatService;

    public ChattrUltraController(ChattrUltraService geminiChatService) {
        this.geminiChatService = geminiChatService;
    }

    @PostMapping
    public ResponseEntity<ChattrUltra> askQuestion(@RequestBody ChatRequest chatRequest) {
        log.info("Received chat request for question: {}", chatRequest.getQuestion());

        if (chatRequest.getQuestion() == null || chatRequest.getQuestion().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (chatRequest.getConversationId() == null || chatRequest.getConversationId().trim().isEmpty()) {
            chatRequest.setConversationId("conv-" + System.currentTimeMillis());
        }

        ChattrUltra response = geminiChatService.sendQuestionToGemini(chatRequest);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{conversationId}")
    public ResponseEntity<List<ChattrUltra>> getConversationHistory(
            @PathVariable String conversationId) {

        List<ChattrUltra> history = geminiChatService.getConversationHistory(conversationId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "Gemini Chat Service");
        status.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(status);
    }
}