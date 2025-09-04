package com.twizzle.server.controllers;

import com.twizzle.server.models.Twizzle;
import com.twizzle.server.models.ChatRequest;
import com.twizzle.server.models.ConversationGroup;
import com.twizzle.server.services.InteractionService;
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
    public ResponseEntity<List<Twizzle>> getConversationHistory(@PathVariable String conversationId) {

        List<Twizzle> history = interactionService.getConversationHistory(conversationId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/user-history/{userId}")
    public ResponseEntity<List<ConversationGroup>> getUserHistory(@PathVariable String userId) {
        List<ConversationGroup> userHistory = interactionService.getUserHistoryGrouped(userId);
        return ResponseEntity.ok(userHistory);
    }

    @PostMapping("/generate")
    public ResponseEntity<Twizzle> askQuestion(@RequestBody ChatRequest chatRequest) {
        log.info("Received chat request for question: {}", chatRequest.getQuestion());

        if (chatRequest.getQuestion() == null || chatRequest.getQuestion().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (chatRequest.getConversationId() == null || chatRequest.getConversationId().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Twizzle response = interactionService.sendQuestionToModel(chatRequest);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete/{conversationId}")
    public ResponseEntity<Twizzle> deleteConversation(@PathVariable String conversationId) {
        log.info("Deleting conversation: {}", conversationId);

        if (conversationId == null || conversationId.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        interactionService.deleteConversation(conversationId);
        return ResponseEntity.ok().build();
    }
}
