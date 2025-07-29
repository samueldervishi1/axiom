package com.axiom.server.services;

import com.axiom.server.models.ChatRequest;
import com.axiom.server.models.Axiom;
import com.axiom.server.models.ModelRequest;
import com.axiom.server.models.ModelResponse;
import com.axiom.server.repositories.AxiomRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@Slf4j
@Transactional
public class AxiomService {

    private final AxiomRepository axiomRepository;
    private final RestTemplate restTemplate;
    private final LoggingService loggingService;

    public AxiomService(AxiomRepository axiomRepository, LoggingService loggingService) {
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
            String chattrAnswer = callModelApi(chatRequest.getQuestion());
            conversation.setChattrAnswer(chattrAnswer);
            conversation.setSuccess(true);
        } catch (Exception e) {
            log.error("Error calling API", e);
            loggingService.logError("ChattrUltraService", "sendQuestionToModel", e.getMessage(), e);
            conversation.setChattrAnswer("Sorry, I encountered an error while processing your question.");
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
            loggingService.logError("ChattrUltraService", "getConversationHistory", e.getMessage(), e);
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
