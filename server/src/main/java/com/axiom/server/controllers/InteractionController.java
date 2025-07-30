package com.axiom.server.controllers;

import com.axiom.server.models.Axiom;
import com.axiom.server.models.ChatRequest;
import com.axiom.server.models.ConversationGroup;
import com.axiom.server.services.InteractionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mindstream")
@Slf4j
public class InteractionController {

    private final InteractionService interactionService;

    public InteractionController(InteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @GetMapping("/history/{conversationId}")
    public ResponseEntity<List<Axiom>> getConversationHistory(@PathVariable String conversationId) {

        List<Axiom> history = interactionService.getConversationHistory(conversationId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/user-history/{userId}")
    public ResponseEntity<List<ConversationGroup>> getUserHistory(@PathVariable String userId) {
        List<ConversationGroup> userHistory = interactionService.getUserHistoryGrouped(userId);
        return ResponseEntity.ok(userHistory);
    }

    @PostMapping("/generate")
    public ResponseEntity<Axiom> askQuestion(@RequestBody ChatRequest chatRequest) {
        log.info("Received chat request for question: {}", chatRequest.getQuestion());

        if (chatRequest.getQuestion() == null || chatRequest.getQuestion().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (chatRequest.getConversationId() == null || chatRequest.getConversationId().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Axiom response = interactionService.sendQuestionToModel(chatRequest);

        return ResponseEntity.ok(response);
    }
}
