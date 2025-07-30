package com.axiom.server.services;

import com.axiom.server.models.LLM;
import com.axiom.server.repositories.LLMRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LLMService {

    private final LLMRepository llmRepository;

    public LLMService(LLMRepository llmRepository) {
        this.llmRepository = llmRepository;
    }

    public LLM save(LLM llm) {
        return llmRepository.save(llm);
    }

    public List<LLM> findAll() {
        return llmRepository.findAll();
    }
}
