package com.axiom.server.controllers;

import com.axiom.server.exceptions.CustomException;
import com.axiom.server.models.Comment;
import com.axiom.server.services.DBService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/comments")
public class CommentsController {

    private final DBService dbService;

    public CommentsController(DBService dbService) {
        this.dbService = dbService;
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<Map<String, Object>>> getCommentsByPostId(@PathVariable String postId,
            @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "GET_COMMENTS_BY_POST_ID");
            request.put("postId", postId);
            request.put("page", page);
            request.put("size", size);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            return ResponseEntity.ok(result);
        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @GetMapping("/{postId}/count")
    public ResponseEntity<Map<String, Object>> getPostCommentsCount(@PathVariable Long postId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "GET_POST_COMMENTS_COUNT");
            request.put("postId", postId);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                throw new CustomException(404, "Post not found");
            }

            return ResponseEntity.ok(result.get(0));

        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @PostMapping("/create/{userId}/{postId}")
    public ResponseEntity<Map<String, Object>> createComment(@PathVariable String userId, @PathVariable String postId,
            @RequestBody Comment comment) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "CREATE_COMMENT");
            request.put("userId", userId);
            request.put("postId", postId);
            request.put("content", comment.getContent());

            if (comment.getCommentTimestamp() != null) {
                request.put("commentTimestamp", comment.getCommentTimestamp().toString());
            }

            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                throw new CustomException(500, "Failed to create comment");
            }

            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{postId}/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteComment(@PathVariable String postId,
            @PathVariable String commentId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "DELETE_COMMENT");
            request.put("commentId", commentId);
            request.put("postId", postId);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Comment deleted successfully");
                response.put("commentId", commentId);
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }
}
