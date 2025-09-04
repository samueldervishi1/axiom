package com.twizzle.server.controllers;

import com.twizzle.server.exceptions.CustomException;
import com.twizzle.server.models.Post;
import com.twizzle.server.models.ScheduledPostRequest;
import com.twizzle.server.services.DBService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDateTime;
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
        Map<String, Object> request = new HashMap<>();
        request.put("action", "GET_POST_BY_ID");
        request.put("postId", postId);

        return handleSingleResultQuery(request);
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
        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @GetMapping("/count/{postId}")
    public ResponseEntity<Map<String, Object>> getPostLikesCount(@PathVariable Long postId) {
        if (postId == null) {
            throw new CustomException(400, "Post ID is required");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("postId", postId);
        return querySingleResult("GET_POST_LIKES_COUNT", params, "Post not found");
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> listUserPosts(@PathVariable String userId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "GET_USER_POSTS");
            request.put("userId", userId);
            request.put("page", page);
            request.put("size", size);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (!result.isEmpty()) {
                return ResponseEntity.ok(result.get(0));
            } else {
                return ResponseEntity
                        .ok(Map.of("content", List.of(), "totalElements", 0, "totalPages", 0, "currentPage", page,
                                "pageSize", size, "first", true, "last", true, "hasNext", false, "hasPrevious", false));
            }
        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllPostsPaged(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Map<String, Object> request = new HashMap<>();
        request.put("action", "GET_ALL_POSTS_PAGED");
        request.put("page", page);
        request.put("size", size);

        return handlePagedQuery(request, page, size);
    }

    @GetMapping("/scheduled")
    public ResponseEntity<Map<String, Object>> getAllScheduledPostsPaged(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "GET_ALL_SCHEDULED_POSTS_PAGED");
            request.put("page", page);
            request.put("size", size);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                Map<String, Object> response = createEmptyPageResponse(page, size);
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @PostMapping(value = "/create", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity<Map<String, Object>> createPost(@RequestBody Post post) {
        validatePostContent(post.getContent());
        validateAuthorId(post.getAuthorId());

        Map<String, Object> params = new HashMap<>();
        params.put("content", post.getContent());
        params.put("authorId", post.getAuthorId());
        params.put("authorName", post.getAuthorName());

        return querySingleResult("create", params, "Failed to create post");
    }

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<Map<String, Object>> createPostMultipart(@RequestParam("content") String content,
            @RequestParam("authorId") String authorId, @RequestParam("authorName") String authorName,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        validatePostContent(content);
        validateAuthorId(authorId);
        validateAuthorName(authorName);

        try {
            if (image != null && !image.isEmpty()) {
                validateImageFile(image);

                Post postObj = new Post();
                postObj.setContent(content);
                postObj.setAuthorId(authorId);
                postObj.setAuthorName(authorName);
                postObj.setImageData(image.getBytes());
                postObj.setImageFilename(image.getOriginalFilename());
                postObj.setImageContentType(image.getContentType());

                List<Map<String, Object>> result = dbService.createPostWithImage(postObj);
                return ResponseEntity.ok(result.get(0));
            } else {
                Map<String, Object> params = new HashMap<>();
                params.put("content", content);
                params.put("authorId", authorId);
                params.put("authorName", authorName);

                return querySingleResult("create", params, "Failed to create post");
            }
        } catch (IOException e) {
            throw new CustomException(400, "Error processing image: " + e.getMessage());
        } catch (SQLException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @GetMapping("/{postId}/image")
    public ResponseEntity<byte[]> getPostImage(@PathVariable Long postId) {
        if (postId == null) {
            throw new CustomException(400, "Post ID is required");
        }

        try {
            Map<String, Object> imageData = dbService.getPostImageData(postId);

            if (imageData == null) {
                throw new CustomException(404, "Image not found");
            }

            Object imageDataObj = imageData.get("IMAGE_DATA");
            byte[] imageBytes = null;

            if (imageDataObj instanceof byte[]) {
                imageBytes = (byte[]) imageDataObj;
            } else if (imageDataObj instanceof java.sql.Blob blob) {
                try {
                    imageBytes = blob.getBytes(1, (int) blob.length());
                } catch (SQLException sqlEx) {
                    throw new CustomException(500, "Error reading image data");
                }
            } else if (imageDataObj != null) {
                throw new CustomException(500, "Unsupported image data format");
            }

            if (imageBytes == null || imageBytes.length == 0) {
                throw new CustomException(404, "Image not found");
            }

            String contentType = (String) imageData.get("IMAGE_CONTENT_TYPE");
            String filename = (String) imageData.get("IMAGE_FILENAME");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(
                    MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"));
            headers.setContentDispositionFormData("inline", filename);

            return ResponseEntity.ok().headers(headers).body(imageBytes);

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException(500, "Failed to retrieve image");
        }
    }

    @PostMapping("/create-scheduled")
    public ResponseEntity<Map<String, Object>> createScheduledPost(@RequestBody ScheduledPostRequest request) {
        validatePostContent(request.getContent());
        validateAuthorId(request.getAuthorId());
        validateScheduledTime(request.getScheduledFor());

        try {
            List<Map<String, Object>> result = dbService.createScheduledPost(request.getAuthorId(),
                    request.getContent(), request.getAuthorName(), request.getScheduledFor());
            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    @PostMapping("/like/{postId}")
    public ResponseEntity<Map<String, Object>> likePost(@PathVariable Long postId,
            @RequestBody Map<String, Object> requestBody) {
        String userId = extractUserId(requestBody.get("userId"));

        Map<String, Object> request = new HashMap<>();
        request.put("action", "LIKE_POST");
        request.put("postId", postId);
        request.put("userId", userId);

        return handleSingleResultQuery(request);
    }

    @GetMapping("/liked/{userId}/{postId}")
    public ResponseEntity<Map<String, Object>> checkUserLikedPost(@PathVariable Long userId,
            @PathVariable Long postId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("action", "CHECK_USER_LIKED_POST");
            request.put("postId", postId);
            request.put("userId", userId);

            List<Map<String, Object>> result = dbService.executeQuery(request);

            Map<String, Object> response = new HashMap<>();
            response.put("likeDetails", result.get(0));

            return ResponseEntity.ok(response);
        } catch (SQLException | IOException e) {
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
        } catch (SQLException | IOException e) {
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

    private ResponseEntity<Map<String, Object>> handleSingleResultQuery(Map<String, Object> request) {
        try {
            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                throw new CustomException(404, "Post not found");
            }

            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    private ResponseEntity<Map<String, Object>> handlePagedQuery(Map<String, Object> request, int page, int size) {
        try {
            List<Map<String, Object>> result = dbService.executeQuery(request);

            if (result.isEmpty()) {
                return ResponseEntity.ok(createEmptyPageResponse(page, size));
            }

            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    private String extractUserId(Object userIdObj) {
        if (userIdObj == null || userIdObj.toString().trim().isEmpty()) {
            throw new CustomException(400, "User ID is required");
        }
        return userIdObj.toString();
    }

    private ResponseEntity<Map<String, Object>> querySingleResult(String action, Map<String, Object> params,
            String notFoundMessage) {
        try {
            params.put("action", action);
            List<Map<String, Object>> result = dbService.executeQuery(params);
            if (result.isEmpty()) {
                throw new CustomException(404, notFoundMessage);
            }
            return ResponseEntity.ok(result.get(0));
        } catch (SQLException | IOException e) {
            throw new CustomException(500, "Database error: " + e.getMessage());
        }
    }

    private void validatePostContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new CustomException(400, "Post content cannot be empty");
        }
        if (content.length() > 4000) {
            throw new CustomException(400, "Post content too long");
        }
    }

    private void validateAuthorId(String authorId) {
        if (authorId == null || authorId.trim().isEmpty()) {
            throw new CustomException(400, "Author ID is required");
        }
    }

    private void validateScheduledTime(LocalDateTime scheduledFor) {
        if (scheduledFor == null) {
            throw new CustomException(400, "Scheduled time is required");
        }
        if (scheduledFor.isBefore(LocalDateTime.now())) {
            throw new CustomException(400, "Scheduled time cannot be in the past");
        }
    }

    private void validateAuthorName(String authorName) {
        if (authorName == null || authorName.trim().isEmpty()) {
            throw new CustomException(400, "Author name is required");
        }
    }

    private void validateImageFile(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new CustomException(400, "Image file is required");
        }

        // Check file size (max 10MB)
        if (image.getSize() > 10 * 1024 * 1024) {
            throw new CustomException(400, "Image file too large (max 10MB)");
        }

        // Check if it's actually an image
        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new CustomException(400, "File must be an image");
        }

        // Allow common image formats
        if (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/gif")
                && !contentType.equals("image/webp")) {
            throw new CustomException(400, "Unsupported image format. Please use JPEG, PNG, GIF, or WebP");
        }
    }
}
