package com.chattr.server.services;

import com.chattr.server.models.LLM;
import com.chattr.server.repositories.LLMRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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

    public Optional<LLM> findById(Long id) {
        return llmRepository.findById(id);
    }

    public long count() {
        return llmRepository.count();
    }
}
