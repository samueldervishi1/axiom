package com.chattr.server.controllers;

import com.chattr.server.models.Story;
import com.chattr.server.services.StoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/stories")
public class StoryController {

    private final StoryService storyService;

    public StoryController(StoryService storyService) {
        this.storyService = storyService;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadStory(@RequestParam("files") MultipartFile[] files,
            @RequestParam("userId") String userId, @RequestParam("username") String username,
            @RequestParam(value = "caption", required = false) String caption) {

        storyService.createStory(userId, username, files, caption);
        return ResponseEntity.ok("Story uploaded successfully.");
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Story>> getUserStories(@PathVariable String userId) {
        List<Story> stories = storyService.getUserStories(userId);
        return ResponseEntity.ok(stories);
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<List<Story>> getUserStoriesByUsername(@PathVariable String username) {
        List<Story> stories = storyService.getUserStoriesByUsername(username);
        return ResponseEntity.ok(stories);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Story>> getAllActiveStories() {
        List<Story> stories = storyService.getAllActiveStories();
        return ResponseEntity.ok(stories);
    }

    @GetMapping("/{storyId}/views")
    public ResponseEntity<Map<String, Integer>> getStoryViewCount(@PathVariable Long storyId) {
        Map<String, Integer> viewCount = storyService.getStoryViewCount(storyId);
        return ResponseEntity.ok(viewCount);
    }

    @PostMapping("/{storyId}/view")
    public ResponseEntity<String> markStoryAsViewed(@PathVariable Long storyId, @RequestParam String viewerId) {

        storyService.markStoryAsViewed(storyId, viewerId);
        return ResponseEntity.ok("Story marked as viewed.");
    }
}
