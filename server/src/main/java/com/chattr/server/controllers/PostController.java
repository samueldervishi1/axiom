package com.chattr.server.controllers;

import com.chattr.server.exceptions.CustomException;
import com.chattr.server.models.Post;
import com.chattr.server.services.DBService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.naming.NamingException;
import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/posts")
public class PostController {

    private final DBService dbService;

    public PostController(DBService dbService) {
        this.dbService = dbService;
    }

    @GetMapping("/{postId}")
    public ResponseEntity<Map<String, Object>> getPost(@PathVariable Long postId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "GET_POST_BY_ID");
            request.put("postId", postId);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                throw new CustomException(404, "Post not found");
            }

            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException | NamingException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @GetMapping("/likes/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserLikedPosts(@PathVariable String userId) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                throw new CustomException(400, "User ID is required");
            }

            Map<String, Object> request = new HashMap<>();
            request.put("action", "GET_USER_LIKED_POSTS");
            request.put("userId", userId);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                Map<String, Object> emptyResponse = new HashMap<>();
                emptyResponse.put("likedPosts", new ArrayList<>());
                emptyResponse.put("totalCount", 0);
                emptyResponse.put("userId", userId);
                return ResponseEntity.ok(emptyResponse);
            }

            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException | NamingException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @GetMapping("/count/{postId}")
    public ResponseEntity<Map<String, Object>> getPostLikesCount(@PathVariable Long postId) {
        try {
            if (postId == null) {
                throw new CustomException(400, "Post ID is required");
            }

            Map<String, Object> request = new HashMap<>();
            request.put("action", "GET_POST_LIKES_COUNT");
            request.put("postId", postId);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                throw new CustomException(404, "Post not found");
            }

            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException | NamingException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> listUserPosts(@PathVariable String userId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "GET_USER_POSTS");
            request.put("userId", userId);

            List<Map<String, Object>> result = dbService.executeQuery(request);
            return ResponseEntity.ok(result);
        } catch (SQLException | IOException | NamingException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllPostsPaged(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "GET_ALL_POSTS_PAGED");
            request.put("page", page);
            request.put("size", size);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                Map<String, Object> response = createEmptyPageResponse(page, size);
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException | NamingException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createPost(@RequestBody Post post) {
        try {
            if (post.getContent() == null || post.getContent().trim().isEmpty()) {
                throw new CustomException(400, "Post content cannot be empty");
            }

            if (post.getContent().length() > 4000) {
                throw new CustomException(400, "Post content too long");
            }

            if (post.getAuthorId() == null || post.getAuthorId().trim().isEmpty()) {
                throw new CustomException(400, "Username is required");
            }

            Map<String, Object> request = new HashMap<>();
            request.put("action", "create");
            request.put("content", post.getContent());
            request.put("authorId", post.getAuthorId());
            request.put("authorName", post.getAuthorName());

            List<Map<String, Object>> result = dbService.executeQuery(request);
            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException | NamingException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @PostMapping("/like/{postId}")
    public ResponseEntity<Map<String, Object>> likePost(@PathVariable Long postId,
            @RequestBody Map<String, Object> requestBody) {
        try {
            Object userIdObj = requestBody.get("userId");
            String userId;

            if (userIdObj == null) {
                throw new CustomException(400, "User ID is required");
            }

            userId = userIdObj.toString();

            if (userId.trim().isEmpty()) {
                throw new CustomException(400, "User ID is required");
            }

            if (userIdObj instanceof Long) {
                userId = String.valueOf(userIdObj);
            } else if (userIdObj instanceof Integer) {
                userId = String.valueOf(userIdObj);
            } else if (userIdObj instanceof String) {
                userId = (String) userIdObj;
            } else {
                userId = String.valueOf(userIdObj);
            }

            if (userId.trim().isEmpty()) {
                throw new CustomException(400, "User ID cannot be empty");
            }

            Map<String, Object> request = new HashMap<>();
            request.put("action", "LIKE_POST");
            request.put("postId", postId);
            request.put("userId", userId);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                throw new CustomException(404, "Post not found");
            }

            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException | NamingException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{postId}")
    public ResponseEntity<Map<String, Object>> deletePost(@PathVariable Long postId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "DELETE_POST");
            request.put("postId", postId);

            List<Map<String, Object>> result = dbService.executeQuery(request);
            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException | NamingException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    private Map<String, Object> createEmptyPageResponse(int page, int size) {
        Map<String, Object> response = new HashMap<>();
        response.put("content", List.of());
        response.put("totalElements", 0L);
        response.put("totalPages", 0);
        response.put("currentPage", page);
        response.put("pageSize", size);
        response.put("first", true);
        response.put("last", true);
        response.put("hasNext", false);
        response.put("hasPrevious", false);
        return response;
    }
}
