package com.axiom.server.utils;

import com.axiom.server.exceptions.CustomException;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

public class ValidationUtils {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private static final Pattern ALPHANUMERIC_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+$");

    private static final int MAX_USERNAME_LENGTH = 50;
    private static final int MAX_EMAIL_LENGTH = 100;
    private static final int MAX_NAME_LENGTH = 100;
    private static final int MAX_CONTENT_LENGTH = 5000;
    private static final int MAX_QUERY_LENGTH = 200;

    public static String validateAndTrimString(String value, String fieldName, int maxLength, boolean required) {
        if (!StringUtils.hasText(value)) {
            if (required) {
                throw new CustomException(400, fieldName + " is required");
            }
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new CustomException(400, fieldName + " cannot exceed " + maxLength + " characters");
        }

        return trimmed;
    }

    public static Long validateUserId(Long userId) {
        if (userId == null || userId <= 0) {
            throw new CustomException(400, "Invalid user ID");
        }
        return userId;
    }

    public static String validateUserIdString(String userId) {
        if (!StringUtils.hasText(userId)) {
            throw new CustomException(400, "User ID is required");
        }

        String trimmed = userId.trim();
        try {
            long id = Long.parseLong(trimmed);
            if (id <= 0) {
                throw new CustomException(400, "User ID must be positive");
            }
        } catch (NumberFormatException e) {
            throw new CustomException(400, "Invalid user ID format");
        }

        return trimmed;
    }

    public static Long validatePostId(Long postId) {
        if (postId == null || postId <= 0) {
            throw new CustomException(400, "Invalid post ID");
        }
        return postId;
    }

    public static String validatePostIdString(String postId) {
        if (!StringUtils.hasText(postId)) {
            throw new CustomException(400, "Post ID is required");
        }

        String trimmed = postId.trim();
        try {
            long id = Long.parseLong(trimmed);
            if (id <= 0) {
                throw new CustomException(400, "Post ID must be positive");
            }
        } catch (NumberFormatException e) {
            throw new CustomException(400, "Invalid post ID format");
        }

        return trimmed;
    }

    public static String validateUsername(String username) {
        String validated = validateAndTrimString(username, "Username", MAX_USERNAME_LENGTH, true);

        assert validated != null;
        if (!ALPHANUMERIC_PATTERN.matcher(validated).matches()) {
            throw new CustomException(400, "Username can only contain letters, numbers, underscores, and hyphens");
        }

        return validated;
    }

    public static String validateEmail(String email) {
        String validated = validateAndTrimString(email, "Email", MAX_EMAIL_LENGTH, true);
        assert validated != null;
        String lowercased = validated.toLowerCase();

        if (!EMAIL_PATTERN.matcher(lowercased).matches()) {
            throw new CustomException(400, "Invalid email format");
        }

        return lowercased;
    }

    public static String validateContent(String content) {
        return validateAndTrimString(content, "Content", MAX_CONTENT_LENGTH, true);
    }

    public static String validateSearchQuery(String query) {
        String validated = validateAndTrimString(query, "Search query", MAX_QUERY_LENGTH, true);

        assert validated != null;
        if (validated.length() < 2) {
            throw new CustomException(400, "Search query must be at least 2 characters long");
        }

        return validated;
    }

    public static void validatePagination(int page, int size) {
        if (page < 0) {
            throw new CustomException(400, "Page number cannot be negative");
        }

        if (size < 1 || size > 100) {
            throw new CustomException(400, "Page size must be between 1 and 100");
        }
    }

    public static String validateName(String name, String fieldName) {
        return validateAndTrimString(name, fieldName, MAX_NAME_LENGTH, true);
    }

    public static String validateAlphanumeric(String value, String fieldName) {
        String validated = validateAndTrimString(value, fieldName, 50, true);

        assert validated != null;
        if (!ALPHANUMERIC_PATTERN.matcher(validated).matches()) {
            throw new CustomException(400, fieldName + " can only contain letters, numbers, underscores, and hyphens");
        }

        return validated;
    }
}
