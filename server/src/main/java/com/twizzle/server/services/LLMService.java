package com.twizzle.server.services;

import com.twizzle.server.models.LLM;
import com.twizzle.server.repositories.LLMRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LLMService {

    private final LLMRepository llmRepository;
    private final CacheManager cacheManager;

    public LLMService(LLMRepository llmRepository, CacheManager cacheManager) {
        this.llmRepository = llmRepository;
        this.cacheManager = cacheManager;
    }

    public LLM save(LLM llm) {
        LLM savedLLM = llmRepository.save(llm);
        cacheManager.clearCache("llm-all");
        if (llm.getId() != null) {
            var llmCache = cacheManager.<Long, LLM>getCache("llm-by-id");
            llmCache.put(llm.getId(), savedLLM);
        }

        return savedLLM;
    }

    public List<LLM> findAll() {
        var llmCache = cacheManager.<String, List<LLM>>getCache("llm-all");
        List<LLM> cachedLLMs = llmCache.getIfPresent("all");
        if (cachedLLMs != null) {
            return cachedLLMs;
        }

        List<LLM> llms = llmRepository.findAll();
        llmCache.put("all", llms);
        return llms;
    }
}
