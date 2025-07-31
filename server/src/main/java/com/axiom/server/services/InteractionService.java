package com.axiom.server.services;

import com.axiom.server.models.*;
import com.axiom.server.repositories.AxiomRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class InteractionService {

    private final AxiomRepository axiomRepository;
    private final RestTemplate restTemplate;
    private final LoggingService loggingService;

    public InteractionService(AxiomRepository axiomRepository, LoggingService loggingService) {
        this.axiomRepository = axiomRepository;
        this.restTemplate = new RestTemplate();
        this.loggingService = loggingService;
    }

    public Axiom sendQuestionToModel(ChatRequest chatRequest) {
        Axiom conversation = new Axiom();
        conversation.setUserQuestion(chatRequest.getQuestion());
        conversation.setConversationId(chatRequest.getConversationId());
        conversation.setUserId(chatRequest.getUserId());

        try {
            String answer = callModelApi(chatRequest.getQuestion());
            conversation.setChattrAnswer(answer);
            conversation.setSuccess(true);
        } catch (Exception e) {
            log.error("Error calling API", e);
            loggingService.logError("InteractionService", "sendQuestionToModel", e.getMessage(), e);
            conversation.setChattrAnswer(e.getMessage() != null ? e.getMessage() : "API call failed");
            conversation.setSuccess(false);
            conversation.setErrorMessage(e.getMessage());
        }

        Axiom savedConversation = axiomRepository.save(conversation);
        log.info("Saved conversation to Oracle database with ID: {}", savedConversation.getId());

        return savedConversation;
    }

    public List<Axiom> getConversationHistory(String conversationId) {
        return axiomRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public List<ConversationGroup> getUserHistoryGrouped(String userId) {
        List<Axiom> allMessages = axiomRepository.findByUserIdOrderByConversationIdAscCreatedAtAsc(userId);

        Map<String, List<Axiom>> groupedByConversation = allMessages.stream()
                .collect(Collectors.groupingBy(Axiom::getConversationId));

        return groupedByConversation.entrySet().stream().map(entry -> {
            String conversationId = entry.getKey();
            List<Axiom> messages = entry.getValue();

            ConversationGroup group = new ConversationGroup();
            group.setConversationId(conversationId);
            group.setUserId(userId);
            group.setMessages(messages);
            group.setMessageCount(messages.size());
            group.setStartedAt(messages.get(0).getCreatedAt());
            group.setLastMessageAt(messages.get(messages.size() - 1).getCreatedAt());

            return group;
        }).collect(Collectors.toList());
    }

    public void deleteConversation(String conversationId) {
        try {
            axiomRepository.deleteByConversationId(conversationId);
            log.info("Successfully deleted conversation with ID: {}", conversationId);
        } catch (Exception e) {
            log.error("Error deleting conversation with ID: {}", conversationId, e);
            loggingService.logError("InteractionService", "deleteConversation", e.getMessage(), e);
            throw new RuntimeException("Failed to delete conversation", e);
        }
    }

    private String callModelApi(String question) {
        String url = apiURL;

        ModelRequest request = new ModelRequest(question);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        HttpEntity<ModelRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<ModelResponse> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    ModelResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return extractResponse(response.getBody());
            } else {
                throw new RuntimeException("API call failed: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error calling API: {}", e.getMessage());
            loggingService.logError("InteractionService", "getConversationHistory", e.getMessage(), e);
            throw new RuntimeException("Failed to get response", e);
        }
    }

    private String extractResponse(ModelResponse response) {
        if (response.getCandidates() != null && !response.getCandidates().isEmpty()) {
            ModelResponse.Candidate candidate = response.getCandidates().get(0);
            if (candidate.getContent() != null && candidate.getContent().getParts() != null
                    && !candidate.getContent().getParts().isEmpty()) {
                return candidate.getContent().getParts().get(0).getText();
            }
        }
        return "No response generated";
    }

    @Value("${api.key}")
    private String apiKey;

    @Value("${api.url}")
    private String apiURL;
}
