package com.twizzle.server.controllers;

import com.twizzle.server.models.Hashtag;
import com.twizzle.server.services.HashtagService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/hashtags")
public class HashtagController {

    private final HashtagService hashtagService;

    public HashtagController(HashtagService hashtagService) {
        this.hashtagService = hashtagService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllHashtags() {
        try {
            List<Hashtag> hashtags = hashtagService.getAllHashtags();
            Map<String, Object> response = new HashMap<>();
            response.put("hashtags", hashtags);
            response.put("count", hashtags.size());
            response.put("code", 200);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve hashtags");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("code", 500);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/post")
    public ResponseEntity<Map<String, Object>> createHashtag(@RequestBody Hashtag hashtag) {
        try {
            Hashtag createdHashtag = hashtagService.createHashtag(hashtag);
            Map<String, Object> response = new HashMap<>();
            response.put("hashtag", createdHashtag);
            response.put("message", "Hashtag created successfully");
            response.put("code", 201);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create hashtag");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("code", 400);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create hashtag");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("code", 500);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
