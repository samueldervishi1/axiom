package com.axiom.server.controllers;

import com.axiom.server.models.User;
import com.axiom.server.services.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/search")
public class SearchController {

    private final SearchService searchService;
    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/all")
    public ResponseEntity<List<User>> searchAll(@RequestParam String query) {
        List<User> users = searchService.searchUsers(query);
        return ResponseEntity.ok(users);
    }
}
