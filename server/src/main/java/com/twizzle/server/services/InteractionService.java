package com.twizzle.server.services;

import com.twizzle.server.models.*;
import com.twizzle.server.repositories.TwizzleRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
public class InteractionService {

    private final TwizzleRepository twizzleRepository;
    private final RestTemplate restTemplate;
    private final LoggingService loggingService;

    public InteractionService(TwizzleRepository twizzleRepository, LoggingService loggingService) {
        this.twizzleRepository = twizzleRepository;
        this.restTemplate = createRestTemplateWithTimeouts();
        this.loggingService = loggingService;
    }

    private RestTemplate createRestTemplateWithTimeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        return new RestTemplate(factory);
    }

    public Twizzle sendQuestionToModel(ChatRequest chatRequest) {
        Twizzle conversation = new Twizzle();
        conversation.setUserQuestion(chatRequest.getQuestion());
        conversation.setConversationId(chatRequest.getConversationId());
        conversation.setUserId(chatRequest.getUserId());

        try {
            String answer = callModelApi(chatRequest.getQuestion());
            conversation.setChattrAnswer(answer);
            conversation.setSuccess(true);
        } catch (IllegalStateException e) {
            log.error("Configuration error: {}", e.getMessage());
            loggingService.logError("InteractionService", "sendQuestionToModel",
                    "Configuration error: " + e.getMessage(), e);
            conversation.setChattrAnswer("Service temporarily unavailable due to configuration issue");
            conversation.setSuccess(false);
            conversation.setErrorMessage("Configuration error");
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("API communication failed")) {
                log.error("API communication error: {}", e.getMessage());
                loggingService.logError("InteractionService", "sendQuestionToModel",
                        "API communication error: " + e.getMessage(), e);
                conversation.setChattrAnswer("Unable to connect to AI service. Please try again later.");
                conversation.setSuccess(false);
                conversation.setErrorMessage("API communication error");
            } else {
                throw e;
            }
        } catch (Exception e) {
            log.error("Unexpected error during API call", e);
            loggingService.logError("InteractionService", "sendQuestionToModel", "Unexpected error: " + e.getMessage(),
                    e);
            conversation.setChattrAnswer("An unexpected error occurred. Please try again later.");
            conversation.setSuccess(false);
            conversation.setErrorMessage("Unexpected error");
        }

        Twizzle savedConversation = twizzleRepository.save(conversation);
        log.info("Saved conversation to Oracle database with ID: {}", savedConversation.getId());

        return savedConversation;
    }

    public List<Twizzle> getConversationHistory(String conversationId) {
        return twizzleRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public List<ConversationGroup> getUserHistoryGrouped(String userId) {
        List<Twizzle> allMessages = twizzleRepository.findByUserIdOrderByConversationIdAscCreatedAtAsc(userId);

        Map<String, List<Twizzle>> groupedByConversation = allMessages.stream()
                .collect(Collectors.groupingBy(Twizzle::getConversationId));

        return groupedByConversation.entrySet().stream().map(entry -> {
            String conversationId = entry.getKey();
            List<Twizzle> messages = entry.getValue();

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
            twizzleRepository.deleteByConversationId(conversationId);
            log.info("Successfully deleted conversation with ID: {}", conversationId);
        } catch (Exception e) {
            log.error("Error deleting conversation with ID: {}", conversationId, e);
            loggingService.logError("InteractionService", "deleteConversation", e.getMessage(), e);
            throw new RuntimeException("Failed to delete conversation", e);
        }
    }

    private String callModelApi(String question) {
        if (apiURL == null || apiURL.trim().isEmpty()) {
            throw new IllegalStateException("API URL is not configured");
        }
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("API key is not configured");
        }

        String url = apiURL;
        ModelRequest request = new ModelRequest(question);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);
        headers.set("User-Agent", "Twizzle-Server/1.0");

        HttpEntity<ModelRequest> entity = new HttpEntity<>(request, headers);

        try {
            long startTime = System.currentTimeMillis();

            ResponseEntity<ModelResponse> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    ModelResponse.class);

            long responseTime = System.currentTimeMillis() - startTime;
            log.debug("API call completed in {}ms with status: {}", responseTime, response.getStatusCode());

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return extractResponse(response.getBody());
            } else {
                String errorMsg = String.format("API call failed with status: %s", response.getStatusCode());
                log.warn(errorMsg);
                throw new RuntimeException(errorMsg);
            }
        } catch (RestClientException e) {
            log.error("REST client error calling API: {}", e.getMessage());
            loggingService.logError("InteractionService", "callModelApi", "REST client error: " + e.getMessage(), e);
            throw new RuntimeException("API communication failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error calling API: {}", e.getMessage());
            loggingService.logError("InteractionService", "callModelApi", "Unexpected error: " + e.getMessage(), e);
            throw new RuntimeException("Failed to get response from API", e);
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
