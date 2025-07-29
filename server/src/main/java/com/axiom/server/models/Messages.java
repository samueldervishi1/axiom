package com.axiom.server.models;

import java.util.regex.Pattern;

public final class Messages {

    // === Roles ===
    public static final String DEFAULT_ROLE = "simple_account";

    // === Validation Messages ===
    public static final String INVALID_EMAIL_FORMAT = "Please enter a valid email address.";
    public static final String EMAIL_ALREADY_EXISTS = "This email is already in use.";
    public static final String USERNAME_ALREADY_EXISTS = "This username is already taken.";
    public static final String NAME_TOO_SHORT = "Full name must be at least 2 characters.";
    public static final String INVALID_PASSWORD_FORMAT = "Password must be at least 8 characters long and include a letter, a number, and a symbol.";

    // === Regex Patterns ===
    public static final Pattern EMAIL_PATTERN = Pattern
            .compile("^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");
    public static final Pattern PASSWORD_PATTERN = Pattern
            .compile("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$");

    // === User-related Errors ===
    public static final String USER_ID_ERROR = "User ID must not be null or empty.";
    public static final String USER_NOT_FOUND_BY_USERNAME = "No user found with username: %s";
    public static final String USER_NOT_FOUND_BY_ID = "No user found with ID: %s";
    public static final String USER_NOT_FOUND = "User not found. %s";
    public static final String INVALID_CREDENTIALS = "Invalid username or password.";

    public static final String REPORT_ERROR = "Unable to submit report. Please try again.";
    public static final String USER_SHOULD_NOT_BE_NULL = "User cannot be null";

    public static final String INVALID_CHANNEL_ID = "Missing or invalid channelId for registration.";

    // === Registration ===
    public static final String REGISTER_SUCCESS = "User have successfully registered.";

    public static final String STORY_NOT_FOUND = "Story not found";
    public static final String BLOCK_NOT_ALLOWED = "You cannot block yourself";

    private Messages() {
        // Prevent instantiation
    }
}
