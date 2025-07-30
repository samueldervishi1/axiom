package com.axiom.server.controllers;

import com.axiom.server.models.LLM;
import com.axiom.server.services.LLMService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/llm")
public class LLMController {

    private final LLMService llmService;

    public LLMController(LLMService llmService) {
        this.llmService = llmService;
    }

    @GetMapping
    public ResponseEntity<List<LLM>> getAll() {
        List<LLM> llm = llmService.findAll();
        return ResponseEntity.ok(llm);
    }

    @PostMapping
    public ResponseEntity<LLM> create(@RequestBody LLM llm) {
        LLM saved = llmService.save(llm);
        return ResponseEntity.ok(saved);
    }
}
