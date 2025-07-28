package com.chattr.server.controllers;

import com.chattr.server.models.LLM;
import com.chattr.server.services.LLMService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/llm")
public class LLMController {

    private final LLMService llmService;

    public LLMController(LLMService llmService) {
        this.llmService = llmService;
    }

    @PostMapping
    public ResponseEntity<LLM> create(@RequestBody LLM llm) {
        LLM saved = llmService.save(llm);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<LLM>> getAll() {
        List<LLM> llms = llmService.findAll();
        return ResponseEntity.ok(llms);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LLM> getById(@PathVariable Long id) {
        Optional<LLM> llm = llmService.findById(id);
        return llm.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getCount() {
        long count = llmService.count();
        return ResponseEntity.ok(count);
    }
}
