package com.twizzle.server.controllers;

import com.twizzle.server.models.User;
import com.twizzle.server.services.SearchService;
import com.twizzle.server.utils.ValidationUtils;
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
        String validatedQuery = ValidationUtils.validateSearchQuery(query);

        List<User> users = searchService.searchUsers(validatedQuery);
        return ResponseEntity.ok(users);
    }
}
