package com.axiom.server.services;

import com.axiom.server.exceptions.CustomException;
import com.axiom.server.models.Messages;
import com.axiom.server.models.Story;
import com.axiom.server.repositories.StoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StoryService {

    private final StoryRepository storyRepository;
    private final LoggingService loggingService;

    public StoryService(StoryRepository storyRepository, LoggingService loggingService) {
        this.storyRepository = storyRepository;
        this.loggingService = loggingService;
    }

    public void createStory(String userId, String username, MultipartFile[] files, String caption) {
        String sessionId = loggingService.getCurrentSessionId();

        try {
            loggingService.logInfo("StoryService", "createStory",
                    String.format("User %s creating story with %d files", userId, files.length));

            String sanitizedUserId = validateAndSanitizeUserId(userId);

            long maxSize = getMaxFileSizeInBytes();

            Path userUploadPath = createSecureUserPath(sanitizedUserId);

            loggingService.logDebug("StoryService", "createStory",
                    String.format("Created/verified user directory: %s", userUploadPath));

            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    throw new CustomException(400, "Uploaded file is empty.");
                }

                if (file.getSize() > maxSize) {
                    String sizeDetails = String.format("File size: %d bytes, Max allowed: %d bytes (%d MB)",
                            file.getSize(), maxSize, maxSize / (1024 * 1024));

                    loggingService.logWarn("StoryService", "createStory",
                            "File exceeds maximum allowed size: " + sizeDetails);

                    loggingService.logSecurityEvent("FILE_SIZE_VIOLATION", userId, sessionId,
                            String.format("User attempted to upload oversized file. %s", sizeDetails));

                    throw new CustomException(413,
                            "File exceeds the maximum allowed size of " + maxSize / (1024 * 1024) + "MB");
                }

                String extension = getFileExtension(file.getOriginalFilename());
                String filename = UUID.randomUUID() + "." + extension;

                Path destination = userUploadPath.resolve(filename).normalize();

                if (!destination.startsWith(userUploadPath)) {
                    String securityDetails = String.format(
                            "Attempted path: %s, User directory: %s, Original filename: %s", destination,
                            userUploadPath, file.getOriginalFilename());

                    loggingService.logWarn("StoryService", "createStory",
                            "Path traversal attempt detected: " + securityDetails);

                    loggingService.logSecurityEvent("PATH_TRAVERSAL_ATTEMPT", userId, sessionId,
                            String.format("User attempted path traversal attack. %s", securityDetails));

                    throw new SecurityException("Invalid file path: outside user directory");
                }

                file.transferTo(destination.toFile());

                loggingService.logDebug("StoryService", "createStory",
                        String.format("File saved successfully: %s", destination));

                Story story = new Story();
                story.setUserId(userId);
                story.setUsername(username);
                story.setCaption(caption);
                story.setMediaPath(uploadDir + "/" + sanitizedUserId + "/" + filename);
                story.setIsVideo(isVideoFile(extension));
                story.setCreatedAt(LocalDateTime.now());
                story.setExpiresAt(LocalDateTime.now().plusHours(24));
                story.setViewedBy(new HashSet<>());

                storyRepository.save(story);
            }

        } catch (CustomException e) {
            loggingService.logWarn("StoryService", "createStory",
                    String.format("Story creation failed for user %s: %s", userId, e.getMessage()));
            throw e;
        } catch (IOException e) {
            loggingService.logError("StoryService", "createStory",
                    String.format("Failed to store story files for user %s", userId), e);

            loggingService.logSecurityEvent("STORY_UPLOAD_ERROR", userId, sessionId,
                    String.format("File upload error for user %s: %s", userId, e.getMessage()));

            throw new CustomException(500, "Internal Server error: " + e.getMessage());
        } catch (Exception e) {
            loggingService.logError("StoryService", "createStory",
                    String.format("Unexpected error creating story for user %s", userId), e);
            throw new CustomException(500, "Failed to create story");
        }
    }

    public List<Story> getUserStories(String userId) {
        return storyRepository.findByUserIdAndExpiresAtAfter(userId, LocalDateTime.now());
    }

    public List<Story> getAllActiveStories() {
        return storyRepository.findByExpiresAtAfter(LocalDateTime.now());
    }

    public Map<String, Integer> getStoryViewCount(Long storyId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new CustomException(404, String.format(Messages.STORY_NOT_FOUND)));

        int count = story.getViewedBy() != null ? story.getViewedBy().size() : 0;
        return Map.of("views-count", count);
    }

    public void markStoryAsViewed(Long storyId, String viewerId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new CustomException(404, String.format(Messages.STORY_NOT_FOUND)));

        if (!story.getUserId().equals(viewerId) && !story.getViewedBy().contains(viewerId)) {
            story.getViewedBy().add(viewerId);
            storyRepository.save(story);
        }
    }

    public List<Story> getUserStoriesByUsername(String username) {
        return storyRepository.findByUsernameAndExpiresAtAfter(username, LocalDateTime.now());
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new CustomException(400, "Invalid filename: no extension found");
        }

        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        Set<String> allowedExtensions = getAllowedExtensions();

        if (!allowedExtensions.contains(extension)) {
            throw new CustomException(400, "File type not allowed: " + extension);
        }

        return extension;
    }

    private String validateAndSanitizeUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new CustomException(400, "User ID cannot be null or empty.");
        }

        String trimmedUserId = userId.trim();
        if (trimmedUserId.length() > 100) {
            throw new CustomException(400, "User ID exceeds maximum allowed length.");
        }

        if (!trimmedUserId.matches("^[a-zA-Z0-9_-]+$")) {
            loggingService.logSecurityEvent("INVALID_USER_ID", userId, loggingService.getCurrentSessionId(),
                    String.format("User ID contains invalid characters: %s", userId));
            throw new CustomException(400, "User ID contains invalid characters");
        }

        String lowerCaseUserId = trimmedUserId.toLowerCase();
        if (lowerCaseUserId.startsWith("con") || lowerCaseUserId.startsWith("prn") || lowerCaseUserId.startsWith("aux")
                || lowerCaseUserId.startsWith("nul") || lowerCaseUserId.startsWith("com")
                || lowerCaseUserId.startsWith("lpt")) {
            throw new CustomException(400, "User ID cannot start with reserved system names");
        }

        return trimmedUserId;
    }

    private Path createSecureUserPath(String sanitizedUser) throws IOException {
        Path baseUploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        if (!Files.exists(baseUploadPath)) {
            Files.createDirectories(baseUploadPath);
        }

        Path userUploadPath = baseUploadPath.resolve(sanitizedUser).normalize();

        if (!userUploadPath.startsWith(baseUploadPath)) {
            throw new SecurityException("Invalid user directory: outside base directory");
        }

        Files.createDirectories(userUploadPath);

        return userUploadPath;
    }

    private long getMaxFileSizeInBytes() {
        String size = maxFileSizeConfig.trim().toUpperCase();
        if (size.endsWith("MB")) {
            return Long.parseLong(size.replace("MB", "").trim()) * 1024 * 1024;
        } else if (size.endsWith("KB")) {
            return Long.parseLong(size.replace("KB", "").trim()) * 1024;
        } else {
            return Long.parseLong(size);
        }
    }

    private boolean isVideoFile(String extension) {
        return List.of("mp4", "mov", "avi", "webm", "mkv").contains(extension.toLowerCase());
    }

    private Set<String> getAllowedExtensions() {
        if (allowedExtensionsConfig == null || allowedExtensionsConfig.trim().isEmpty()) {
            loggingService.logWarn("StoryService", "getAllowedExtensions",
                    "No allowed extensions configured, using defaults");
            return Set.of("jpg", "jpeg", "png", "gif", "mp4", "mov", "avi");
        }

        return Arrays.stream(allowedExtensionsConfig.split(",")).map(String::trim).map(String::toLowerCase)
                .filter(ext -> !ext.isEmpty()).collect(Collectors.toSet());
    }

    @Value("${story.upload-dir}")
    private String uploadDir;

    @Value("${story.allowed-extensions}")
    private String allowedExtensionsConfig;

    @Value("${story.max-file-size}")
    private String maxFileSizeConfig;
}
